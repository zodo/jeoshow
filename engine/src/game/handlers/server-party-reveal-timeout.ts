import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { applyRevealScores } from '../state-utils'

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

	const players = applyRevealScores(
		state as GameState & { stage: typeof state.stage },
	)

	return {
		state: { ...state, players },
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
