import type { PackModel } from 'shared/models/siq'
import type { GameEvents } from 'shared/models/events'
import type { ScheduledCommand } from './state-machine-models'

type PlayerId = string

export interface GameState {
	pack: PackModel.Pack
	mediaMapping: Record<string, string>
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

export interface Countdown {
	max: number
	finishesAt: number
}

export type Stage =
	| { type: 'before-start' }
	| (RoundStageType & RoundStageBase)
	| { type: 'after-finish' }

export interface RoundStageBase {
	roundModel: PackModel.Round
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
			questionModel: PackModel.Question
			falseStartPlayers: PlayerId[]
	  }
	| {
			type: 'ready-for-hit'
			questionModel: PackModel.Question
			falseStartPlayers: PlayerId[]
	  }
	| {
			type: 'awaiting-answer'
			questionModel: PackModel.Question
			answeringPlayer: string
			falseStartPlayers: PlayerId[]
	  }
	| {
			type: 'answer'
			questionModel: PackModel.Question
	  }
	| {
			type: 'appeal'
			questionModel: PackModel.Question
			answer: string
			playerId: PlayerId
			resolutions: Record<PlayerId, boolean>
	  }
	| { type: 'appeal-result'; resolution: boolean }

export interface AnswersSummary {
	model?: PackModel.Question
	answers: PlayerAnswer[]
}

export interface PlayerAnswer {
	playerId: PlayerId
	text: string
	isCorrect: boolean
	scoreDiff: number
}

export const toSnapshot = (stage: Stage): GameEvents.StageSnapshot => {
	switch (stage.type) {
		case 'before-start':
			return { type: 'before-start' }
		case 'round':
			return {
				type: 'round',
				name: stage.roundModel.name,
				themes: [
					...stage.roundModel.themes.map((t) => ({
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
			}
		case 'question':
		case 'ready-for-hit':
		case 'awaiting-answer':
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

			return {
				type: 'question',
				fragments: stage.questionModel.fragments,
				price: stage.questionModel.price,
				theme: stage.roundModel.themes.find((t) =>
					t.questions.some((q) => q.id === stage.questionModel.id)
				)!.name,
				substate: substate,
			}
		case 'answer':
			return {
				type: 'answer',
				theme: stage.roundModel.themes.find((t) =>
					t.questions.some((q) => q.id === stage.questionModel.id)
				)!.name,
				model: stage.questionModel.answers,
			}
		case 'appeal':
			return {
				type: 'appeal',
				model: stage.questionModel,
				answer: stage.answer,
				playerId: stage.playerId,
				resolutions: stage.resolutions,
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
