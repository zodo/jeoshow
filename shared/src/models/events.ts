import type { PackModel } from './siq'

export namespace GameEvents {
	export type GameEvent =
		| { type: 'player-hit-the-button'; playerId: string }
		| { type: 'player-false-start'; playerId: string }
		| { type: 'player-texted'; playerId: string; text: string }
		| { type: 'players-updated'; players: Player[] }
		| { type: 'stage-updated'; stage: StageSnapshot }

	export interface Player {
		id: string
		name: string
		score: number
		disconnected: boolean
	}

	export type QuestionState =
		| { type: 'idle' }
		| { type: 'ready-for-hit'; timeoutSeconds: number }
		| { type: 'awaiting-answer'; activePlayerId: string; timeoutSeconds: number }

	export type StageSnapshot =
		| { type: 'before-start' }
		| {
				type: 'round'
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
				timeoutSeconds: number
		  }
		| {
				type: 'question'
				fragments: PackModel.FragmentGroup[]
				price: number
				theme: string
				themeComment?: string
				substate: QuestionState
		  }
		| {
				type: 'answer'
				theme: string
				model: PackModel.Answers
		  }
		| {
				type: 'appeal'
				model: PackModel.Question
				answer: string
				playerId: string
				resolutions: Record<string, boolean>
		  }
		| { type: 'appeal-result'; resolution: boolean }
		| { type: 'after-finish' }
}
