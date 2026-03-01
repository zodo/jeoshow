import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { applyRevealScores } from '../state-utils'

const handleClientPartyRevealReady = (
	state: GameState,
	command: ClientCommand.OfType<'party-reveal-ready'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'party-reveal') {
		return {}
	}

	if (state.stage.finishedRevealPlayers.includes(command.playerId)) {
		return {}
	}

	const stage = {
		...state.stage,
		finishedRevealPlayers: [...state.stage.finishedRevealPlayers, command.playerId],
	}

	const connectedPlayers = state.players.filter((p) => !p.disconnected)
	const readyCount = stage.finishedRevealPlayers.length
	const majorityReached = readyCount >= connectedPlayers.length / 2

	if (majorityReached) {
		const players = applyRevealScores(
			state as GameState & { stage: typeof state.stage },
		)

		return {
			state: { ...state, players, stage },
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

	return { state: { ...state, stage } }
}

export default handleClientPartyRevealReady
