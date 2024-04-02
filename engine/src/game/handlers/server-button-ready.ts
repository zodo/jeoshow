import type { GameState, Stage } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleServerButtonReady = (
	state: GameState,
	command: ServerCommand.OfType<'button-ready'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'question' && state.stage.type !== 'answer-attempt') {
		return { state, effects: [] }
	}

	if (command.action.callbackId && state.stage.callbackId !== command.action.callbackId) {
		return { state, effects: [] }
	}

	const callbackId: string = Math.random().toString(36).substring(7)

	const callbackTimeout =
		state.stage.type === 'question'
			? Math.floor(state.stage.questionReadTime / 2)
			: Timeouts.awaitingHit
	const newStage: Extract<Stage, { type: 'ready-for-hit' }> = {
		...state.stage,
		type: 'ready-for-hit',
		falseStartPlayers: [],
		callbackId,
		callbackTimeout,
	}

	return {
		state: { ...state, stage: newStage },
		effects: [
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
