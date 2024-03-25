import type { PackModel } from 'shared/models/siq'
import type { GameEvents } from 'shared/models/events'
import {
	getRound,
	type CommandContext,
	type ScheduledCommand,
	getQuestion,
} from './state-machine-models'

type PlayerId = string

export interface GameState {
	packId: string
	players: Player[]
	stage: Stage
	scheduledCommands: ScheduledCommand[]
}

export interface Player {
	id: PlayerId
	name: string
	score: number
	disconnected: boolean
}

export type Stage =
	| { type: 'before-start' }
	| (RoundStageType & RoundStageBase)
	| { type: 'after-finish' }

export interface RoundStageBase {
	roundId: string
	takenQuestions: string[]
	activePlayer: string
	previousAnswers: AnswersSummary
	callbackId?: string
	callbackTimeout?: number
}

type RoundStageType =
	| {
			type: 'round'
	  }
	| {
			type: 'question'
			questionId: string
			falseStartPlayers: PlayerId[]
			questionReadTime: number
	  }
	| {
			type: 'ready-for-hit'
			questionId: string
			falseStartPlayers: PlayerId[]
	  }
	| {
			type: 'awaiting-answer'
			questionId: string
			answeringPlayer: string
			falseStartPlayers: PlayerId[]
	  }
	| {
			type: 'answer'
			questionId: string
	  }
	| {
			type: 'appeal'
			questionId: string
			answer: string
			playerId: PlayerId
			resolutions: Record<PlayerId, boolean>
	  }
	| { type: 'appeal-result'; resolution: boolean }

export interface AnswersSummary {
	questionId?: string
	answers: PlayerAnswer[]
	triedToAppeal: PlayerId[]
}

export interface PlayerAnswer {
	playerId: PlayerId
	text: string
	isCorrect: boolean
	scoreDiff: number
}

export const toSnapshot = (stage: Stage, ctx: CommandContext): GameEvents.StageSnapshot => {
	switch (stage.type) {
		case 'before-start': {
			return { type: 'before-start' }
		}
		case 'round': {
			const round = getRound(ctx, stage.roundId)
			const playerIdsCanAppeal = stage.previousAnswers.answers
				.map((a) => a.playerId)
				.filter((p) => !stage.previousAnswers.triedToAppeal.includes(p))

			return {
				type: 'round',
				name: round.name,
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
		case 'awaiting-answer': {
			let substate: GameEvents.QuestionState
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
