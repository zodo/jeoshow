import type { GameState } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'

const handleServerDisconnect = (
	state: GameState,
	command: ServerCommandOfType<'disconnect'>
): UpdateResult => {
	const player = state.players.find((p) => p.id === command.action.playerId)
	if (!player) {
		return { state, events: [] }
	}
	const newPlayers = state.players.map((p) => {
		if (p.id === command.action.playerId) {
			return { ...p, disconnected: true }
		}
		return p
	})
	return {
		state: { ...state, players: newPlayers },
		events: [
			{
				type: 'broadcast',
				event: { type: 'PlayersUpdated', players: newPlayers },
			},
		],
	}
}

export default handleServerDisconnect
