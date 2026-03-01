import type { PackModel } from './siq'

export interface Player {
	id: string
	name: string
	avatarUrl?: string
	score: number
	disconnected: boolean
	answerAttemts: number
	ping: number
}

export interface PartyVerdict {
	playerId: string
	answer: string
	correct: boolean
	scoreDiff: number
	confidenceBet: boolean
}

export type QuestionState =
	| { type: 'idle' }
	| { type: 'ready-for-hit'; timeoutSeconds: number }
	| { type: 'awaiting-answer'; activePlayerId: string; timeoutSeconds: number }
	| { type: 'llm-checking'; activePlayerId: string }
	| { type: 'answer-attempt' }

export type GameMode = 'classic' | 'party'

export type StageSnapshot = { gameMode: GameMode } & (
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
			skipRoundVoting?: {
				yes: string[]
				no: string[]
				timeoutSeconds: number
			}
			appealVoting?: {
				question: PackModel.Question
				answer: string
				playerId: string
				agree: string[]
				disagree: string[]
				timeoutSeconds: number
			}
			appealResolution?: 'approved' | 'rejected'
	  }
	| {
			type: 'question'
			fragments: PackModel.FragmentGroup[]
			price: number
			theme: string
			themeComment?: string
			substate: QuestionState
			falselyStartedPlayerIds: string[]
			selectAnswerOptions?: PackModel.SelectAnswerOption[]
	  }
	| {
			type: 'answer'
			theme: string
			model: PackModel.Answers
			canSkip: boolean
			votedForSkip: string[]
	  }
	| {
			type: 'party-question'
			fragments: PackModel.FragmentGroup[]
			price: number
			theme: string
			themeComment?: string
			timeoutSeconds: number
			submittedPlayerIds: string[]
			selectAnswerOptions?: PackModel.SelectAnswerOption[]
	  }
	| {
			type: 'party-checking'
	  }
	| {
			type: 'party-reveal'
			verdicts: PartyVerdict[]
	  }
	| { type: 'after-finish' }
)
