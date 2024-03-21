import { toSnapshot, type GameState } from '../models'
import type { ClientCommandOfType, UpdateResult } from '../state-machine-models'
import type { GameEvents } from 'shared/models/events'

const handleClientIntroduce = (
	state: GameState,
	command: ClientCommandOfType<'Introduce'>
): UpdateResult => {
	const existingPlayer = state.players.find((p) => p.id === command.playerId)
	const player: GameEvents.Player = {
		id: command.playerId,
		name: command.action.name,
		score: existingPlayer?.score || 0,
		disconnected: false,
	}
	const newPlayers = [...state.players.filter((p) => p.id !== command.playerId), player]

	return {
		state: { ...state, players: newPlayers },
		events: [
			{
				type: 'broadcast',
				event: { type: 'PlayersUpdated', players: newPlayers },
			},
			{
				type: 'reply',
				event: { type: 'StageUpdated', stage: toSnapshot(state.stage) },
			},
		],
	}
}

export default handleClientIntroduce
