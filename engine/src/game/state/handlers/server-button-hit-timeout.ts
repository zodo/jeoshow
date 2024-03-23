import { toSnapshot, type GameState, type Stage } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'

const handleServerButtonHitTimeout = (
	state: GameState,
	command: ServerCommandOfType<'button-hit-timeout'>
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
						questionId: state.stage.questionModel.id,
					},
				},
			},
		],
	}
}

export default handleServerButtonHitTimeout
