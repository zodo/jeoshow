import type { GameState, Stage } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { getRound, toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleServerRoundReturn = (
	state: GameState,
	command: ServerCommand.OfType<'round-return'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'answer' &&
		state.stage.type !== 'appeal-result' &&
		state.stage.type !== 'appeal'
	) {
		return { state, effects: [] }
	}
	const roundModel = getRound(ctx, state.stage.roundId)

	const hasMoreQuestions =
		roundModel.themes.flatMap((t) => t.questions).length > state.stage.takenQuestions.length
	const hasMoreRounds = ctx.pack.rounds[ctx.pack.rounds.length - 1].id !== state.stage.roundId
	const callbackId: string = Math.random().toString(36).substring(7)

	let activePlayer = state.stage.activePlayer
	if (state.players.find((p) => p.id === activePlayer)?.disconnected) {
		const alivePlayers = state.players.filter((p) => !p.disconnected)
		if (alivePlayers.length > 0) {
			activePlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)].id
		}
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
			effects: [
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
			effects: [
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
				},
			],
		}
	}
}

export default handleServerRoundReturn
