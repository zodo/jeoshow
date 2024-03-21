import type { PackModel } from './siq'

export namespace GameEvents {
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

	export type QuestionState =
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
						id: string
						price: number
						available: boolean
					}[]
				}[]
				activePlayerId: string
		  }
		| {
				type: 'Question'
				fragments: PackModel.FragmentGroup[]
				price: number
				theme: string
				substate: QuestionState
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
}
