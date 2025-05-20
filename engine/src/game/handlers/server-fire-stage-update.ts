import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'

const handleServerFireStageUpdate = (
	state: GameState,
	command: ServerCommand.OfType<'fire-stage-update'>,
	ctx: CommandContext
): UpdateResult => {
	return {
		effects: [
			{
				type: 'client-broadcast',
				event: {
					type: 'stage-updated',
					stage: toSnapshot(state.stage, ctx),
				},
			},
		],
	}
}

export default handleServerFireStageUpdate
