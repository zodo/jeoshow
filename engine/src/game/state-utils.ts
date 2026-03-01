import type { GameMode, QuestionState, StageSnapshot } from 'shared/models/models'
import type { Player } from 'shared/models/models'
import type { GameState, Stage } from './models/state'
import type { CommandContext } from './models/state-machine'

/** Apply verdict scoreDiffs to players. */
export function applyRevealScores(
	state: GameState & { stage: Extract<Stage, { type: 'party-reveal' }> }
): Player[] {
	const verdicts = state.stage.verdicts
	return state.players.map((p) => {
		const verdict = verdicts.find((v) => v.playerId === p.id)
		if (!verdict || verdict.scoreDiff === 0) return p
		return { ...p, score: p.score + verdict.scoreDiff }
	})
}

export const getRound = (ctx: CommandContext, roundId: string) => {
	const round = ctx.pack.rounds.find((r) => r.id === roundId)
	if (!round) {
		throw new Error(`Round not found: ${roundId}`)
	}
	return round
}

export const getQuestion = (ctx: CommandContext, questionId: string) => {
	const question = ctx.pack.rounds
		.flatMap((r) => r.themes.flatMap((t) => t.questions))
		.find((q) => q.id === questionId)
	if (!question) {
		throw new Error(`Question not found: ${questionId}`)
	}
	return question
}

export const toSnapshot = (
	state: Pick<GameState, 'gameMode' | 'players' | 'stage'>,
	ctx: CommandContext
): StageSnapshot => {
	const { stage } = state
	const gameMode: GameMode = state.gameMode

	switch (stage.type) {
		case 'before-start': {
			return { type: 'before-start', gameMode }
		}
		case 'round': {
			const round = getRound(ctx, stage.roundId)
			let playerIdsCanAppeal = stage.previousAnswers.answers
				.filter((a) => !a.isCorrect)
				.map((a) => a.playerId)
				.filter((p) => !stage.previousAnswers.triedToAppeal.includes(p))
			if (
				stage.previousAnswers.questionId &&
				getQuestion(ctx, stage.previousAnswers.questionId).answers.type === 'select'
			) {
				playerIdsCanAppeal = []
			}

			return {
				type: 'round',
				gameMode,
				name: round.name,
				comments: round.comments,
				themes: [
					...round.themes.map((t) => ({
						name: t.name,
						questions: t.questions.map((q) => ({
							id: q.id,
							price: q.price,
							available: stage.takenQuestions.indexOf(q.id) < 0,
						})),
					})),
				],
				activePlayerId: stage.activePlayer,
				timeoutSeconds: stage.callbackTimeout ?? 0,
				playerIdsCanAppeal,
				skipRoundVoting: stage.skipRoundVoting,
				appealVoting: stage.appealVoting
					? {
							...stage.appealVoting,
							question: getQuestion(ctx, stage.appealVoting.questionId),
						}
					: undefined,
				appealResolution: stage.appealResolution,
			}
		}
		case 'question':
		case 'ready-for-hit':
		case 'awaiting-answer':
		case 'llm-checking':
		case 'answer-attempt': {
			let substate: QuestionState
			switch (stage.type) {
				case 'question':
					substate = { type: 'idle' }
					break
				case 'ready-for-hit':
					substate = { type: 'ready-for-hit', timeoutSeconds: stage.callbackTimeout ?? 0 }
					break
				case 'awaiting-answer':
					substate = {
						type: 'awaiting-answer',
						activePlayerId: stage.answeringPlayer,
						timeoutSeconds: stage.callbackTimeout ?? 0,
					}
					break
				case 'llm-checking':
					substate = {
						type: 'llm-checking',
						activePlayerId: stage.answeringPlayer,
					}
					break
				case 'answer-attempt':
					substate = {
						type: 'answer-attempt',
					}
					break
			}

			const round = getRound(ctx, stage.roundId)
			const question = getQuestion(ctx, stage.questionId)
			const theme = round.themes.find((t) => t.questions.some((q) => q.id === question.id))

			const falselyStartedPlayerIds =
				stage.type === 'question' || stage.type === 'ready-for-hit'
					? stage.falseStartPlayers
							.filter(
								(p) => p.playerId === stage.activePlayer && ctx.now < p.expiresAt
							)
							.map((p) => p.playerId)
					: []

			return {
				type: 'question',
				gameMode,
				fragments: question.fragments,
				price: question.price,
				theme: theme?.name ?? '',
				themeComment: theme?.comments,
				substate: substate,
				falselyStartedPlayerIds,
				selectAnswerOptions:
					question.answers.type === 'select' ? question.answers.options : undefined,
			}
		}
		case 'answer': {
			const round = getRound(ctx, stage.roundId)
			const question = getQuestion(ctx, stage.questionId)
			const hasMedia =
				question.answers.type === 'regular' &&
				question.answers.content.some((fg) =>
					fg.some((f) => f.type === 'audio' || f.type === 'video')
				)
			return {
				type: 'answer',
				gameMode,
				theme: round.themes.find((t) => t.questions.some((q) => q.id === stage.questionId))!
					.name,
				model: question.answers,
				canSkip: hasMedia,
				votedForSkip: stage.votedForSkip,
			}
		}
		case 'party-question': {
			const round = getRound(ctx, stage.roundId)
			const question = getQuestion(ctx, stage.questionId)
			const theme = round.themes.find((t) => t.questions.some((q) => q.id === question.id))
			return {
				type: 'party-question',
				gameMode,
				fragments: question.fragments,
				price: question.price,
				theme: theme?.name ?? '',
				themeComment: theme?.comments,
				timeoutSeconds: stage.callbackTimeout ?? stage.answerTimeSeconds,
				submittedPlayerIds: stage.submissions.map((s) => s.playerId),
				selectAnswerOptions:
					question.answers.type === 'select' ? question.answers.options : undefined,
			}
		}
		case 'party-checking': {
			return {
				type: 'party-checking',
				gameMode,
			}
		}
		case 'party-reveal': {
			return {
				type: 'party-reveal',
				gameMode,
				verdicts: stage.verdicts,
			}
		}
		case 'after-finish':
			return { type: 'after-finish', gameMode }
	}
}
