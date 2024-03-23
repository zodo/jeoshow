import { toSnapshot, type GameState, type Stage } from '../models'
import type { ServerCommandOfType, UpdateResult } from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleServerRoundReturn = (
	state: GameState,
	command: ServerCommandOfType<'round-return'>
): UpdateResult => {
	if (state.stage.type !== 'answer') {
		return { state, events: [] }
	}

	const hasMoreQuestions =
		state.stage.roundModel.themes.flatMap((t) => t.questions).length >
		state.stage.takenQuestions.length
	const hasMoreRounds =
		state.pack.rounds[state.pack.rounds.length - 1].idx !== state.stage.roundModel.idx
	const callbackId: string = Math.random().toString(36).substring(7)

	if (hasMoreQuestions || hasMoreRounds) {
		let newStage: Extract<Stage, { type: 'round' }>
		if (hasMoreQuestions) {
			newStage = {
				...state.stage,
				type: 'round',
				callbackId,
				callbackTimeout: Timeouts.selectQuestion,
			}
		} else {
			const answerStage: Extract<Stage, { type: 'answer' }> = state.stage
			const newRoundModel = state.pack.rounds.find(
				(r) => r.idx === answerStage.roundModel.idx + 1
			)
			if (!newRoundModel) {
				throw new Error('newRoundModel not found')
			}
			newStage = {
				...state.stage,
				type: 'round',
				roundModel: newRoundModel,
				takenQuestions: [],
				callbackId,
				callbackTimeout: Timeouts.selectQuestion,
			}
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
						action: { type: 'question-random', callbackId },
					},
					delaySeconds: Timeouts.selectQuestion,
				},
			],
		}
	} else {
		const newStage: Extract<Stage, { type: 'after-finish' }> = {
			type: 'after-finish',
		}

		return {
			state: { ...state, stage: newStage },
			events: [
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(newStage) },
				},
			],
		}
	}
}

export default handleServerRoundReturn
