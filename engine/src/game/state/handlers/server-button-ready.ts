import { toSnapshot, type GameState, type Stage } from '../models'
import type { CommandContext, ServerCommandOfType, UpdateResult } from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleServerButtonReady = (
	state: GameState,
	command: ServerCommandOfType<'button-ready'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'question') {
		return { state, events: [] }
	}

	if (command.action.callbackId && state.stage.callbackId !== command.action.callbackId) {
		return { state, events: [] }
	}

	const callbackId: string = Math.random().toString(36).substring(7)

	const callbackTimeout = Math.floor(state.stage.questionReadTime / 2)
	const newStage: Extract<Stage, { type: 'ready-for-hit' }> = {
		...state.stage,
		type: 'ready-for-hit',
		callbackId,
		callbackTimeout,
	}

	return {
		state: { ...state, stage: newStage },
		events: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
			},
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: { type: 'button-hit-timeout', callbackId },
				},
				delaySeconds: callbackTimeout,
			},
		],
	}
}

export default handleServerButtonReady
