import type { GameState, PartySubmission, Stage } from '../models/state'
import type { PartyVerdict } from 'shared/models/models'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateEffect, UpdateResult } from '../models/state-machine'
import { getQuestion, getRound } from '../state-utils'
import { Timeouts } from '../timeouts'
import { isCorrect } from '../answer-check'
import { extractQuestionText } from '../llm-judge'

const handleServerPartyAnswerTimeout = (
	state: GameState,
	command: ServerCommand.OfType<'party-answer-timeout'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'party-question' ||
		state.stage.callbackId !== command.action.callbackId
	) {
		return { state, effects: [] }
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)
	const round = getRound(ctx, state.stage.roundId)
	const theme = round.themes.find((t) =>
		t.questions.some((q) => q.id === questionModel.id)
	)

	const questionText = extractQuestionText(questionModel.fragments)

	// Auto-pass players who didn't submit
	const submittedPlayerIds = new Set(state.stage.submissions.map((s) => s.playerId))
	const alivePlayers = state.players.filter((p) => !p.disconnected)
	const autoPassSubmissions: PartySubmission[] = alivePlayers
		.filter((p) => !submittedPlayerIds.has(p.id))
		.map((p) => ({
			playerId: p.id,
			answer: '',
			answerText: '',
			submittedAt: ctx.now,
			passed: true,
			confidenceBet: false,
		}))
	const allSubmissions = [...state.stage.submissions, ...autoPassSubmissions]

	const verdicts: PartyVerdict[] = []
	const needsLlm: PartySubmission[] = []

	for (const sub of allSubmissions) {
		if (sub.passed) {
			verdicts.push({
				playerId: sub.playerId,
				answer: sub.answerText,
				correct: false,
				scoreDiff: 0,
				confidenceBet: sub.confidenceBet,
			})
			continue
		}

		const correct = isCorrect(questionModel.answers, sub.answer)
		if (correct || questionModel.answers.type === 'select') {
			verdicts.push({
				playerId: sub.playerId,
				answer: sub.answerText,
				correct,
				scoreDiff: 0, // calculated in verdicts-ready
				confidenceBet: sub.confidenceBet,
			})
		} else {
			needsLlm.push(sub)
		}
	}

	const callbackId = ctx.random().toString(36).substring(7)

	const newStage: Extract<Stage, { type: 'party-checking' }> = {
		...state.stage,
		type: 'party-checking',
		submissions: allSubmissions,
		pendingVerdicts: needsLlm.length,
		verdicts,
		callbackId,
	}

	const effects: UpdateEffect[] = []

	if (needsLlm.length > 0) {
		effects.push({
			type: 'llm-judge-batch',
			entries: needsLlm.map((sub) => ({
				playerId: sub.playerId,
				questionText,
				theme: theme?.name ?? '',
				correctAnswers:
					questionModel.answers.type === 'regular' ? questionModel.answers.correct : [],
				incorrectAnswers:
					questionModel.answers.type === 'regular'
						? (questionModel.answers.incorrect ?? [])
						: [],
				playerAnswer: sub.answer,
			})),
			callbackId,
		})

		// Fallback timeout: assume incorrect for any unresolved
		effects.push({
			type: 'schedule',
			command: {
				type: 'server',
				action: { type: 'party-verdicts-ready', callbackId },
			},
			delaySeconds: Timeouts.partyCheckingTimeout,
		})
	} else {
		// All resolved by string match — go straight to scoring
		effects.push({
			type: 'trigger',
			command: {
				type: 'server',
				action: { type: 'party-verdicts-ready', callbackId },
			},
		})
	}

	return {
		state: { ...state, stage: newStage },
		effects,
	}
}

export default handleServerPartyAnswerTimeout
