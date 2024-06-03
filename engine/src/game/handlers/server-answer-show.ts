import { assertNever } from 'shared/utils/assert-never'
import type { GameState, Stage } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { getQuestion, toSnapshot } from '../state-utils'
import { Timeouts, getFragmentsTime } from '../timeouts'

const handleServerAnswerShow = (
	state: GameState,
	command: ServerCommand.OfType<'answer-show'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'ready-for-hit' &&
		state.stage.type !== 'question' &&
		state.stage.type !== 'awaiting-answer' &&
		state.stage.type !== 'answer-attempt'
	) {
		return { state, effects: [] }
	}

	if (state.stage.questionId !== command.action.questionId) {
		return { state, effects: [] }
	}

	const callbackId: string = Math.random().toString(36).substring(7)
	const stage: Extract<Stage, { type: 'answer' }> = {
		...state.stage,
		type: 'answer',
		finishedMediaPlayers: [],
		callbackId,
		votedForSkip: [],
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)
	let answerShowTime: number
	if (questionModel.answers.type === 'regular') {
		const { seconds, hasMedia } = getFragmentsTime(questionModel.answers.content)
		if (hasMedia) {
			answerShowTime = Timeouts.mediaTimeout
		} else {
			answerShowTime = seconds - 2
		}
	} else if (questionModel.answers.type === 'select') {
		answerShowTime = Timeouts.selectAnswerShow
	} else {
		assertNever(questionModel.answers)
	}

	return {
		state: { ...state, stage },
		effects: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(stage, ctx) },
			},
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: {
						type: 'round-return',
						callbackId,
					},
				},
				delaySeconds: answerShowTime,
			},
		],
	}
}

export default handleServerAnswerShow
