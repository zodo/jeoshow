import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handlePlayerDisconnect = (
	state: GameState,
	command: ServerCommand.OfType<'player-disconnect'>,
	ctx: CommandContext
): UpdateResult => {
	const player = state.players.find((p) => p.id === command.action.playerId)
	if (!player) {
		return { state, effects: [] }
	}
	const newPlayers = state.players.map((p) => {
		if (p.id === command.action.playerId) {
			return { ...p, disconnected: true }
		}
		return p
	})
	const noPlayersLeft = newPlayers.every((p) => p.disconnected)

	if (noPlayersLeft) {
		return {
			effects: [
				{
					type: 'schedule',
					command: {
						type: 'server',
						action: { type: 'state-cleanup' },
					},
					delaySeconds: 60 * 60,
				},
			],
		}
	} else {
		return {
			state: { ...state, players: newPlayers },
			effects: [
				{
					type: 'client-broadcast',
					event: { type: 'players-updated', players: newPlayers },
				},
			],
		}
	}
}

export default handlePlayerDisconnect
