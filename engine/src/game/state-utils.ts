import type { QuestionState, StageSnapshot } from 'shared/models/models'
import type { Stage } from './models/state'
import type { CommandContext } from './models/state-machine'

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

export const toSnapshot = (stage: Stage, ctx: CommandContext): StageSnapshot => {
	switch (stage.type) {
		case 'before-start': {
			return { type: 'before-start' }
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
			}
		}
		case 'question':
		case 'ready-for-hit':
		case 'awaiting-answer':
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
				case 'answer-attempt':
					substate = {
						type: 'answer-attempt',
					}
					break
			}

			const round = getRound(ctx, stage.roundId)
			const question = getQuestion(ctx, stage.questionId)
			const theme = round.themes.find((t) => t.questions.some((q) => q.id === question.id))

			return {
				type: 'question',
				fragments: question.fragments,
				price: question.price,
				theme: theme?.name ?? '',
				themeComment: theme?.comments,
				substate: substate,
				selectAnswerOptions:
					question.answers.type === 'select' ? question.answers.options : undefined,
			}
		}
		case 'answer': {
			const round = getRound(ctx, stage.roundId)
			const question = getQuestion(ctx, stage.questionId)
			return {
				type: 'answer',
				theme: round.themes.find((t) => t.questions.some((q) => q.id === stage.questionId))!
					.name,
				model: question.answers,
			}
		}
		case 'appeal': {
			const question = getQuestion(ctx, stage.questionId)

			const resolutions = Object.entries(stage.resolutions).map(([playerId, resolution]) => ({
				playerId,
				resolution,
			}))
			return {
				type: 'appeal',
				model: question,
				answer: stage.answer,
				playerId: stage.playerId,
				resolutions,
				timeoutSeconds: stage.callbackTimeout ?? 0,
			}
		}

		case 'appeal-result':
			return {
				type: 'appeal-result',
				resolution: stage.resolution,
			}
		case 'after-finish':
			return { type: 'after-finish' }
	}
}
