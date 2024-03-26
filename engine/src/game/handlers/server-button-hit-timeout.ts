import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleServerButtonHitTimeout = (
	state: GameState,
	command: ServerCommand.OfType<'button-hit-timeout'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'ready-for-hit') {
		return { state, effects: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, effects: [] }
	}

	return {
		state: state,
		effects: [
			{
				type: 'trigger',
				command: {
					type: 'server',
					action: {
						type: 'answer-show',
						questionId: state.stage.questionId,
					},
				},
			},
		],
	}
}

export default handleServerButtonHitTimeout
