import { toSnapshot, type GameState, type Stage } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'

const handleServerReadyForHit = (
	state: GameState,
	command: ServerCommandOfType<'ready-for-hit'>
): UpdateResult => {
	if (state.stage.type !== 'Question') {
		return { state, events: [] }
	}

	if (state.stage.questionModel.id !== command.action.questionId) {
		return { state, events: [] }
	}

	const newStage: Extract<Stage, { type: 'ReadyForHit' }> = {
		...state.stage,
		type: 'ReadyForHit',
	}

	return {
		state: { ...state, stage: newStage },
		events: [
			{
				type: 'broadcast',
				event: { type: 'StageUpdated', stage: toSnapshot(newStage) },
			},
		],
	}
}

export default handleServerReadyForHit
