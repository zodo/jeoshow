import type { GameState, Stage } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { getQuestion, toSnapshot } from '../state-utils'
import { getFragmentsTime } from '../timeouts'

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

	const stage: Extract<Stage, { type: 'answer' }> = {
		...state.stage,
		type: 'answer',
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)
	const answerShowTime = Math.ceil(getFragmentsTime(questionModel.answers.content) * 0.7)

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
					},
				},
				delaySeconds: answerShowTime,
			},
		],
	}
}

export default handleServerAnswerShow
