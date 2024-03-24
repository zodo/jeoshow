import { toSnapshot, type GameState, type Stage } from '../models'
import {
	getRound,
	type CommandContext,
	type ServerCommandOfType,
	type UpdateResult,
} from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleServerRoundReturn = (
	state: GameState,
	command: ServerCommandOfType<'round-return'>,
	ctx: CommandContext
): UpdateResult => {
	console.log('handleServerRoundReturn', JSON.stringify(state, null, 2))
	if (state.stage.type !== 'answer' && state.stage.type !== 'appeal-result') {
		return { state, events: [] }
	}
	const roundModel = getRound(ctx, state.stage.roundId)

	const hasMoreQuestions =
		roundModel.themes.flatMap((t) => t.questions).length > state.stage.takenQuestions.length
	const hasMoreRounds = ctx.pack.rounds[ctx.pack.rounds.length - 1].id !== state.stage.roundId
	const callbackId: string = Math.random().toString(36).substring(7)

	let activePlayer = state.stage.activePlayer
	if (state.players.find((p) => p.id === activePlayer)?.disconnected) {
		const alivePlayers = state.players.filter((p) => !p.disconnected)
		activePlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id
	}

	if (hasMoreQuestions || hasMoreRounds) {
		let newStage: Extract<Stage, { type: 'round' }>
		if (hasMoreQuestions) {
			newStage = {
				...state.stage,
				type: 'round',
				activePlayer,
				callbackId,
				callbackTimeout: Timeouts.selectQuestion,
			}
		} else {
			const stageRoundId = state.stage.roundId
			const currentRoundIndex = ctx.pack.rounds.findIndex((r) => r.id === stageRoundId)
			const newRoundModel = ctx.pack.rounds[currentRoundIndex + 1]
			if (!newRoundModel) {
				throw new Error('newRoundModel not found')
			}
			newStage = {
				...state.stage,
				type: 'round',
				activePlayer,
				roundId: newRoundModel.id,
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
					event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
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
					event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
				},
			],
		}
	}
}

export default handleServerRoundReturn
