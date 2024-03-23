import { toSnapshot, type GameState, type Stage } from '../models'
import {
	getRound,
	type CommandContext,
	type ServerCommandOfType,
	type UpdateResult,
} from '../state-machine-models'

const handleServerQuestionRandom = (
	state: GameState,
	command: ServerCommandOfType<'question-random'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'round') {
		return { state, events: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, events: [] }
	}

	const roundModel = getRound(ctx, state.stage.roundId)
	const availableQuestionIds = roundModel.themes
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
