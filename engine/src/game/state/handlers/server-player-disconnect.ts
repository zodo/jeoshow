import type { GameState } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'

const handlePlayerDisconnect = (
	state: GameState,
	command: ServerCommandOfType<'player-disconnect'>
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
				type: 'client-broadcast',
				event: { type: 'players-updated', players: newPlayers },
			},
		],
	}
}

export default handlePlayerDisconnect
