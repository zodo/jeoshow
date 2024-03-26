import type { GameState, Stage } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { getRound } from '../state-utils'

const handleServerQuestionRandom = (
	state: GameState,
	command: ServerCommand.OfType<'question-random'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'round') {
		return { state, effects: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, effects: [] }
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
		effects: [
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
