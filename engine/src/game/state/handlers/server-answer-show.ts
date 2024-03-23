import { toSnapshot, type GameState, type Stage } from '../models'
import {
	getQuestion,
	type CommandContext,
	type ServerCommandOfType,
	type UpdateResult,
} from '../state-machine-models'
import { getFragmentsTime } from '../timeouts'

const handleServerAnswerShow = (
	state: GameState,
	command: ServerCommandOfType<'answer-show'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'ready-for-hit' &&
		state.stage.type !== 'question' &&
		state.stage.type !== 'awaiting-answer'
	) {
		return { state, events: [] }
	}

	if (state.stage.questionId !== command.action.questionId) {
		return { state, events: [] }
	}

	const stage: Extract<Stage, { type: 'answer' }> = {
		...state.stage,
		type: 'answer',
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)
	const answerShowTime = getFragmentsTime(questionModel.answers.content)

	return {
		state: { ...state, stage },
		events: [
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
