import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { applyRevealScores, getQuestion } from '../state-utils'

const handleServerPartyRevealTimeout = (
	state: GameState,
	command: ServerCommand.OfType<'party-reveal-timeout'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'party-reveal' ||
		state.stage.callbackId !== command.action.callbackId
	) {
		return { state, effects: [] }
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)
	const { players, jackpot } = applyRevealScores(
		state as GameState & { stage: typeof state.stage },
		questionModel.price
	)

	return {
		state: { ...state, players, jackpot },
		effects: [
			{
				type: 'trigger',
				command: {
					type: 'server',
					action: { type: 'answer-show', questionId: state.stage.questionId },
				},
			},
		],
	}
}

export default handleServerPartyRevealTimeout
