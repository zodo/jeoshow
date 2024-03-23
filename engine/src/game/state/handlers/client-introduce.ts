import { toSnapshot, type GameState } from '../models'
import type { ClientCommandOfType, CommandContext, UpdateResult } from '../state-machine-models'
import type { GameEvents } from 'shared/models/events'

const handleClientIntroduce = (
	state: GameState,
	command: ClientCommandOfType<'introduce'>,
	ctx: CommandContext
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
				type: 'client-broadcast',
				event: { type: 'players-updated', players: newPlayers },
			},
			{
				type: 'client-reply',
				event: { type: 'stage-updated', stage: toSnapshot(state.stage, ctx) },
			},
		],
	}
}

export default handleClientIntroduce
