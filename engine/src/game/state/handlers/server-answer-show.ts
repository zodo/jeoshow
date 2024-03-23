import { toSnapshot, type GameState, type Stage } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'
import { Timeouts, getFragmentsTime } from '../timeouts'

const handleServerAnswerShow = (
	state: GameState,
	command: ServerCommandOfType<'answer-show'>
): UpdateResult => {
	if (
		state.stage.type !== 'ready-for-hit' &&
		state.stage.type !== 'question' &&
		state.stage.type !== 'awaiting-answer'
	) {
		return { state, events: [] }
	}

	if (state.stage.questionModel.id !== command.action.questionId) {
		return { state, events: [] }
	}

	const stage: Extract<Stage, { type: 'answer' }> = {
		...state.stage,
		type: 'answer',
	}

	const answerShowTime = getFragmentsTime(stage.questionModel.answers.content)

	return {
		state: { ...state, stage },
		events: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(stage) },
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
