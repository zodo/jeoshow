import type { PackModel } from './siq'

export interface Player {
	id: string
	name: string
	avatarUrl?: string
	score: number
	disconnected: boolean
	answerAttemts: number
}

export type QuestionState =
	| { type: 'idle' }
	| { type: 'ready-for-hit'; timeoutSeconds: number }
	| { type: 'awaiting-answer'; activePlayerId: string; timeoutSeconds: number }
	| { type: 'answer-attempt' }

export type StageSnapshot =
	| { type: 'before-start' }
	| {
			type: 'round'
			name: string
			comments?: string
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
			playerIdsCanAppeal: string[]
	  }
	| {
			type: 'question'
			fragments: PackModel.FragmentGroup[]
			price: number
			theme: string
			themeComment?: string
			substate: QuestionState
			selectAnswerOptions?: PackModel.SelectAnswerOption[]
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
			resolutions: { playerId: string; resolution: boolean }[]
			timeoutSeconds: number
	  }
	| { type: 'appeal-result'; resolution: boolean }
	| { type: 'after-finish' }
