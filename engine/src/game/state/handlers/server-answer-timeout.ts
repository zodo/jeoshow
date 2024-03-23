import { toSnapshot, type GameState, type Stage } from '../models'
import type { CommandContext, ServerCommandOfType, UpdateResult } from '../state-machine-models'

const handleServerAnswerTimeout = (
	state: GameState,
	command: ServerCommandOfType<'answer-timeout'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'awaiting-answer') {
		return { state, events: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, events: [] }
	}

	return {
		state: { ...state },
		events: [
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
