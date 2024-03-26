import type { Player } from 'shared/models/models'
import type { ScheduledCommand } from './state-commands'

type PlayerId = string

export interface GameState {
	packId: string
	players: Player[]
	stage: Stage
	scheduledCommands: ScheduledCommand[]
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
