import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleServerAnswerTimeout = (
	state: GameState,
	command: ServerCommand.OfType<'answer-timeout'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'awaiting-answer') {
		return { state, effects: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, effects: [] }
	}

	return {
		state: { ...state },
		effects: [
			{
				type: 'trigger',
				command: {
					type: 'client',
					action: {
						type: 'answer-give',
						value: '¯_(ツ)_/¯',
					},
					playerId: state.stage.answeringPlayer,
				},
			},
		],
	}
}

export default handleServerAnswerTimeout
