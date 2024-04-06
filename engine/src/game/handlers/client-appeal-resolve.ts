import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleClientAppealResolve = (
	state: GameState,
	command: ClientCommand.OfType<'appeal-resolve'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'appeal' || command.playerId === state.stage.playerId) {
		return {}
	}

	const callbackId: string = Math.random().toString(36).substring(7)

	const resolutions = {
		...state.stage.resolutions,
		[command.playerId]: command.action.resolution,
	}

	const playerCount = state.players.filter((p) => !p.disconnected).length

	const agreeSize = Object.values(resolutions).filter((r) => r).length
	const disagreeSize = Object.values(resolutions).filter((r) => !r).length

	const votesLimit = Math.ceil(playerCount / 2)

	const previousAnswers = state.stage.previousAnswers.answers
	const appealingPlayerId = state.stage.playerId
	if (agreeSize >= votesLimit) {
		const newPlayers = state.players.map((p) => {
			const prevAnswer = previousAnswers.find((a) => a.playerId === p.id)
			if (prevAnswer && p.id === appealingPlayerId) {
				return { ...p, score: p.score - prevAnswer.scoreDiff * 2 }
			} else if (prevAnswer) {
				return { ...p, score: p.score - prevAnswer.scoreDiff }
			} else {
				return p
			}
		})

		const newStage: Extract<Stage, { type: 'appeal-result' }> = {
			...state.stage,
			type: 'appeal-result',
			resolution: true,
			activePlayer: state.stage.playerId,
			previousAnswers: {
				answers: [],
				triedToAppeal: [],
			},
			callbackId,
		}

		return {
			state: { ...state, players: newPlayers, stage: newStage },
			effects: [
				{
					type: 'client-broadcast',
					event: { type: 'players-updated', players: newPlayers },
				},
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
				},
				{
					type: 'schedule',
					command: {
						type: 'server',
						action: { type: 'round-return', callbackId },
					},
					delaySeconds: Timeouts.appealResult,
				},
			],
		}
	} else if (disagreeSize >= votesLimit) {
		const newStage: Extract<Stage, { type: 'appeal-result' }> = {
			...state.stage,
			type: 'appeal-result',
			resolution: false,
			callbackId,
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
						action: { type: 'round-return', callbackId },
					},
					delaySeconds: Timeouts.appealResult,
				},
			],
		}
	} else {
		const newStage: Extract<Stage, { type: 'appeal' }> = {
			...state.stage,
			resolutions,
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

export default handleClientAppealResolve
