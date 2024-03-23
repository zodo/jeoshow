import { toSnapshot, type GameState, type Stage } from '../models'
import type { ClientCommandOfType, UpdateEvent, UpdateResult } from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleClientButtonHit = (
	state: GameState,
	command: ClientCommandOfType<'button-hit'>
): UpdateResult => {
	if (
		(state.stage.type === 'question' || state.stage.type === 'ready-for-hit') &&
		state.stage.falseStartPlayers.includes(command.playerId)
	) {
		return {
			events: [
				{
					type: 'client-broadcast',
					event: { type: 'player-false-start', playerId: command.playerId },
				},
			],
		}
	} else if (state.stage.type === 'question') {
		const newStage = {
			...state.stage,
			falseStartPlayers: [...state.stage.falseStartPlayers, command.playerId],
		}
		return {
			state: { ...state, stage: newStage },
			events: [
				{
					type: 'client-broadcast',
					event: { type: 'player-texted', playerId: command.playerId, text: 'РАНО' },
				},
				{
					type: 'client-broadcast',
					event: { type: 'player-false-start', playerId: command.playerId },
				},
			],
		}
	} else if (
		state.stage.type === 'ready-for-hit' &&
		!state.stage.previousAnswers.answers.some((a) => a.playerId === command.playerId)
	) {
		const callbackId = Math.random().toString(36).substring(7)
		const newStage: Extract<Stage, { type: 'awaiting-answer' }> = {
			...state.stage,
			type: 'awaiting-answer',
			answeringPlayer: command.playerId,
			callbackId,
			callbackTimeout: Timeouts.awaitingAnswer,
		}
		return {
			state: {
				...state,
				stage: newStage,
			},
			events: [
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(newStage) },
				},
				{
					type: 'client-broadcast',
					event: { type: 'player-hit-the-button', playerId: command.playerId },
				},
				{
					type: 'client-broadcast',
					event: { type: 'player-texted', playerId: command.playerId, text: "I'm lucky" },
				},
				{
					type: 'schedule',
					command: {
						type: 'server',
						action: { type: 'answer-timeout', callbackId },
					},
					delaySeconds: Timeouts.awaitingAnswer,
				},
			],
		}
	} else {
		return {
			state: state,
			events: [
				{
					type: 'client-broadcast',
					event: { type: 'player-hit-the-button', playerId: command.playerId },
				},
			],
		}
	}
}

export default handleClientButtonHit
