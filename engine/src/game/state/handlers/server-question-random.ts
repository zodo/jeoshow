import { toSnapshot, type GameState, type Stage } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'

const handleServerQuestionRandom = (
	state: GameState,
	command: ServerCommandOfType<'question-random'>
): UpdateResult => {
	if (state.stage.type !== 'round') {
		return { state, events: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, events: [] }
	}

	const availableQuestionIds = state.stage.roundModel.themes
		.flatMap((t) => t.questions)
		.map((q) => q.id)
		.filter(
			(id) => !(state.stage as Extract<Stage, { type: 'round' }>).takenQuestions.includes(id)
		)

	return {
		state: state,
		events: [
			{
				type: 'trigger',
				command: {
					type: 'client',
					action: {
						type: 'question-select',
						questionId:
							availableQuestionIds[
								Math.floor(Math.random() * availableQuestionIds.length)
							],
					},
					playerId: state.stage.activePlayer,
				},
			},
		],
	}
}

export default handleServerQuestionRandom
