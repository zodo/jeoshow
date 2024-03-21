import { toSnapshot, type GameState, type Stage } from '../models'
import type { ClientCommandOfType, UpdateEvent, UpdateResult } from '../state-machine-models'

const handleClientHitButton = (
	state: GameState,
	command: ClientCommandOfType<'HitButton'>
): UpdateResult => {
	let newStage = state.stage
	let events: UpdateEvent[] = []
	if (
		state.stage.type === 'ReadyForHit' &&
		!state.stage.previousAnswers.answers.some((a) => a.playerId === command.playerId)
	) {
		newStage = {
			...state.stage,
			type: 'AwaitingAnswer',
			answeringPlayer: command.playerId,
		}

		events.push({
			type: 'broadcast',
			event: { type: 'StageUpdated', stage: toSnapshot(newStage) },
		})
	}

	return {
		state: state,
		events: [
			{
				type: 'broadcast',
				event: { type: 'PlayerHitTheButton', playerId: command.playerId },
			},
			...events,
		],
	}
}

export default handleClientHitButton
