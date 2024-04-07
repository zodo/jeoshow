import type { AnswersSummary, GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleClientAppealVote = (
	state: GameState,
	command: ClientCommand.OfType<'appeal-vote'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'round' ||
		state.stage.appealResolution ||
		state.stage.skipRoundVoting
	) {
		return {}
	}

	if (state.stage.appealVoting) {
		return handleVote(state, command, ctx)
	} else if (canStartAppeal(state.stage.previousAnswers, command)) {
		return handleStartAppeal(state, command, ctx)
	} else {
		return {}
	}
}

const handleVote = (
	state: GameState,
	command: ClientCommand.OfType<'appeal-vote'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'round') {
		return {}
	}

	if (command.playerId === state.stage.appealVoting?.playerId) {
		return {}
	}

	const appealVoting = state.stage.appealVoting

	if (!appealVoting) {
		return {}
	}

	const callbackId: string = Math.random().toString(36).substring(7)

	let agreeVotes = appealVoting.agree
	let disagreeVotes = appealVoting.disagree

	if (command.action.vote === 'agree') {
		agreeVotes = [...agreeVotes, command.playerId]
	} else {
		disagreeVotes = [...disagreeVotes, command.playerId]
	}

	const playerCount = state.players.filter((p) => !p.disconnected).length

	const votesLimit = Math.ceil(playerCount / 2)

	const previousAnswers = state.stage.previousAnswers.answers
	if (agreeVotes.length > votesLimit) {
		const newPlayers = state.players.map((p) => {
			const prevAnswer = previousAnswers.find((a) => a.playerId === p.id)
			if (prevAnswer && p.id === appealVoting.playerId) {
				return { ...p, score: p.score - prevAnswer.scoreDiff * 2 }
			} else if (prevAnswer) {
				return { ...p, score: p.score - prevAnswer.scoreDiff }
			} else {
				return p
			}
		})

		const newStage: Extract<Stage, { type: 'round' }> = {
			...state.stage,
			activePlayer: appealVoting.playerId,
			appealResolution: 'approved',
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
	} else if (disagreeVotes.length >= votesLimit) {
		const newStage: Extract<Stage, { type: 'round' }> = {
			...state.stage,
			activePlayer: appealVoting.playerId,
			appealResolution: 'rejected',
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
		const newStage: Extract<Stage, { type: 'round' }> = {
			...state.stage,
			appealVoting: {
				...appealVoting,
				agree: agreeVotes,
				disagree: disagreeVotes,
			},
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

const canStartAppeal = (
	previousAnswers: AnswersSummary,
	command: ClientCommand.OfType<'appeal-vote'>
) => {
	return (
		previousAnswers.questionId &&
		previousAnswers.answers.map((a) => a.playerId).includes(command.playerId) &&
		!previousAnswers.triedToAppeal.includes(command.playerId)
	)
}

const handleStartAppeal = (
	state: GameState,
	command: ClientCommand.OfType<'appeal-vote'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'round') {
		return {}
	}

	const callbackId: string = Math.random().toString(36).substring(7)

	const playerAnswer = state.stage.previousAnswers.answers.find(
		(a) => a.playerId === command.playerId
	)?.text

	const newStage: Extract<Stage, { type: 'round' }> = {
		...state.stage,
		appealVoting: {
			questionId: state.stage.previousAnswers.questionId!!,
			answer: playerAnswer ?? '',
			playerId: command.playerId,
			agree: [command.playerId],
			disagree: [],
			timeoutSeconds: Timeouts.appealTimeout,
		},
		previousAnswers: {
			...state.stage.previousAnswers,
			triedToAppeal: [...state.stage.previousAnswers.triedToAppeal, command.playerId],
		},
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
				delaySeconds: Timeouts.appealTimeout,
			},
		],
	}
}

export default handleClientAppealVote
