import type { Player } from 'shared/models/models'
import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'

const handleClientIntroduce = (
	state: GameState,
	command: ClientCommand.OfType<'introduce'>,
	ctx: CommandContext
): UpdateResult => {
	const existingPlayer = state.players.find((p) => p.id === command.playerId)
	const player: Player = {
		id: command.playerId,
		name: command.action.name,
		score: existingPlayer?.score || 0,
		disconnected: false,
	}
	const newPlayers = [...state.players.filter((p) => p.id !== command.playerId), player]

	return {
		state: { ...state, players: newPlayers },
		effects: [
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
