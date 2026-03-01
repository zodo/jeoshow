import type { PartyVerdict } from 'shared/models/models'
import type { GameState, Stage } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateEffect, UpdateResult } from '../models/state-machine'
import { getQuestion } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleServerPartyVerdictsReady = (
	state: GameState,
	command: ServerCommand.OfType<'party-verdicts-ready'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'party-checking' ||
		state.stage.callbackId !== command.action.callbackId
	) {
		return { state, effects: [] }
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)
	const alivePlayers = state.players.filter((p) => !p.disconnected)
	const pot = questionModel.price + state.jackpot

	// Fill in verdicts for players who didn't submit (treat as pass)
	const allVerdicts: PartyVerdict[] = [...state.stage.verdicts]
	for (const sub of state.stage.submissions) {
		if (!allVerdicts.some((v) => v.playerId === sub.playerId)) {
			// LLM didn't return in time — assume incorrect
			allVerdicts.push({
				playerId: sub.playerId,
				answer: sub.answerText,
				correct: false,
				scoreDiff: 0,
				confidenceBet: sub.confidenceBet,
			})
		}
	}
	// Players who didn't submit at all (disconnected or didn't answer)
	for (const player of alivePlayers) {
		if (!allVerdicts.some((v) => v.playerId === player.id)) {
			allVerdicts.push({
				playerId: player.id,
				answer: '',
				correct: false,
				scoreDiff: 0,
				confidenceBet: false,
			})
		}
	}

	const correctVerdicts = allVerdicts.filter((v) => v.correct)

	// Calculate score diffs
	const scoredVerdicts = allVerdicts.map((v) => {
		if (v.correct) {
			let share = Math.round(pot / correctVerdicts.length)

			if (v.confidenceBet) {
				share = share * 2
			}

			return { ...v, scoreDiff: share }
		} else {
			// Wrong answer: only lose points if confidence bet was on
			const scoreDiff = v.confidenceBet ? -questionModel.price : 0
			return { ...v, scoreDiff }
		}
	})

	// Determine active player: fastest correct submitter
	let activePlayer = state.stage.activePlayer
	if (correctVerdicts.length > 0 && state.stage.type === 'party-checking') {
		const correctSubmissions = state.stage.submissions
			.filter((s) => scoredVerdicts.some((v) => v.playerId === s.playerId && v.correct))
			.sort((a, b) => a.submittedAt - b.submittedAt)
		if (correctSubmissions.length > 0) {
			activePlayer = correctSubmissions[0].playerId
		}
	}

	const callbackId = ctx.random().toString(36).substring(7)

	const newStage: Extract<Stage, { type: 'party-reveal' }> = {
		...state.stage,
		type: 'party-reveal',
		verdicts: scoredVerdicts,
		potAmount: pot,
		activePlayer,
		callbackId,
		finishedRevealPlayers: [],
	}

	// Safety timeout — fires party-reveal-timeout which applies scores + triggers answer-show
	const effects: UpdateEffect[] = [
		{
			type: 'schedule',
			command: {
				type: 'server',
				action: { type: 'party-reveal-timeout', callbackId },
			},
			delaySeconds: Timeouts.partyRevealSafetyTimeout,
		},
	]

	// Scores and jackpot are deferred — applied when reveal animation ends
	return {
		state: { ...state, stage: newStage },
		effects,
	}
}

export default handleServerPartyVerdictsReady
