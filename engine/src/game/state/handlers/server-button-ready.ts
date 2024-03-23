import { toSnapshot, type GameState, type Stage } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleServerButtonReady = (
	state: GameState,
	command: ServerCommandOfType<'button-ready'>
): UpdateResult => {
	if (state.stage.type !== 'question') {
		return { state, events: [] }
	}

	if (state.stage.callbackId !== command.action.callbackId) {
		return { state, events: [] }
	}

	const callbackId: string = Math.random().toString(36).substring(7)

	const newStage: Extract<Stage, { type: 'ready-for-hit' }> = {
		...state.stage,
		type: 'ready-for-hit',
		callbackId,
		callbackTimeout: Timeouts.awaitingHit,
	}

	return {
		state: { ...state, stage: newStage },
		events: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(newStage) },
			},
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: { type: 'button-hit-timeout', callbackId },
				},
				delaySeconds: Timeouts.awaitingHit,
			},
		],
	}
}

export default handleServerButtonReady
