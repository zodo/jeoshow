import { PackModel } from './siq'

export type GameEvent =
	| { type: 'PlayersUpdated'; players: Player[] }
	| { type: 'PlayerHitTheButton'; playerId: string }
	| { type: 'StageUpdated'; stage: StageSnapshot }
	| { type: 'PlayerGaveAnswer'; playerId: string; answer: string; isCorrect: boolean }

export interface Player {
	id: string
	name: string
	score: number
	disconnected: boolean
}

export type QuestionSubstate =
	| { type: 'Idle' }
	| { type: 'ReadyForHit' }
	| { type: 'AwaitingAnswer'; activePlayerId: string }

export type StageSnapshot =
	| { type: 'BeforeStart' }
	| {
			type: 'Round'
			name: string
			themes: {
				name: string
				questions: {
					id: number
					price: number
					available: boolean
				}[]
			}[]
			activePlayerId: string
	  }
	| {
			type: 'Question'
			fragments: PackModel.Fragment[]
			price: number
			theme: string
			substate: QuestionSubstate
	  }
	| {
			type: 'Answer'
			model: PackModel.Answers
	  }
	| {
			type: 'Appeal'
			model: PackModel.Question
			answer: string
			playerId: string
			resolutions: Record<string, boolean>
	  }
	| { type: 'AppealResult'; resolution: boolean }
