import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleServerFireStageUpdate = (
	state: GameState,
	command: ServerCommand.OfType<'fire-stage-update'>,
	ctx: CommandContext
): UpdateResult => {
	return {
		effects: [],
	}
}

export default handleServerFireStageUpdate
