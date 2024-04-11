import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handlePingSet = (
	state: GameState,
	command: ClientCommand.OfType<'ping-set'>,
	ctx: CommandContext
): UpdateResult => {
	const players = state.players.map((p) =>
		p.id === command.playerId ? { ...p, ping: command.action.ping } : p
	)

	return {
		state: { ...state, players },
	}
}

export default handlePingSet
