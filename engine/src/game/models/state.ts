import type { Player } from 'shared/models/models'

type PlayerId = string

export interface GameState {
	packId: string
	players: Player[]
	stage: Stage
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
			paused: boolean
			skipRoundVoting?: {
				yes: PlayerId[]
				no: PlayerId[]
				timeoutSeconds: number
			}
			appealVoting?: {
				questionId: string
				answer: string
				playerId: PlayerId
				agree: PlayerId[]
				disagree: PlayerId[]
				timeoutSeconds: number
			}
			appealResolution?: 'approved' | 'rejected'
	  }
	| {
			type: 'question'
			questionId: string
			falseStartPlayers: PlayerId[]
			questionReadTime: number
			finishedMediaPlayers: PlayerId[]
	  }
	| {
			type: 'ready-for-hit'
			questionId: string
			falseStartPlayers: PlayerId[]
			randomizeHits: boolean
			playersWhoHit: PlayerId[]
	  }
	| {
			type: 'awaiting-answer'
			questionId: string
			answeringPlayer: PlayerId
			falseStartPlayers: PlayerId[]
	  }
	| {
			type: 'answer-attempt'
			questionId: string
	  }
	| {
			type: 'answer'
			questionId: string
			finishedMediaPlayers: PlayerId[]
	  }

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
