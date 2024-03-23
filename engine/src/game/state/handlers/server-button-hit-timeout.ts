import { toSnapshot, type GameState, type Stage } from '../models'
import type { CommandContext, ServerCommandOfType, UpdateResult } from '../state-machine-models'

const handleServerButtonHitTimeout = (
	state: GameState,
	command: ServerCommandOfType<'button-hit-timeout'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'ready-for-hit') {
		return { state, events: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, events: [] }
	}

	return {
		state: state,
		events: [
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
