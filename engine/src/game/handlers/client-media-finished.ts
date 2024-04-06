import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleClientMediaFinished = (
	state: GameState,
	command: ClientCommand.OfType<'media-finished'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type === 'question') {
		return {
			effects: [
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
		const callbackId: string = Math.random().toString(36).substring(7)
		return {
			state: { ...state, stage: { ...state.stage, callbackId } },
			effects: [
				{
					type: 'trigger',
					command: {
						type: 'server',
						action: { type: 'round-return', callbackId },
					},
				},
			],
		}
	} else {
		return {}
	}
}

export default handleClientMediaFinished
