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
		avatarUrl: command.action.avatarUrl ?? existingPlayer?.avatarUrl,
		score: existingPlayer?.score || 0,
		answerAttemts: existingPlayer?.answerAttemts || 0,
		disconnected: false,
		ping: existingPlayer?.ping || 0,
	}
	const newPlayers = [...state.players.filter((p) => p.id !== command.playerId), player]

	let newStage = state.stage
	if (state.stage.type === 'round' && state.stage.paused) {
		console.log('Resuming paused round...')
		newStage = { ...state.stage, paused: false, activePlayer: player.id }
	}

	return {
		state: { ...state, stage: newStage, players: newPlayers },
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
