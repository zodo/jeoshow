import { type GameState } from '../models'
import type { ClientCommandOfType, UpdateResult } from '../state-machine-models'

const handleClientMediaFinished = (
	state: GameState,
	command: ClientCommandOfType<'media-finished'>
): UpdateResult => {
	if (state.stage.type === 'question') {
		return {
			events: [
				{
					type: 'trigger',
					command: {
						type: 'server',
						action: { type: 'button-ready' },
					},
				},
			],
		}
	} else if (state.stage.type === 'answer') {
		return {
			events: [
				{
					type: 'trigger',
					command: {
						type: 'server',
						action: { type: 'round-return' },
					},
				},
			],
		}
	} else {
		return {}
	}
}

export default handleClientMediaFinished
