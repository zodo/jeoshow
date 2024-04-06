import type { ClientAction } from 'shared/models/messages'
import type { Player } from 'shared/models/models'
import type { PackModel } from 'shared/models/siq'

export type HapticType = 'light' | 'medium' | 'success' | 'warning'

export type SvelteCustomEvent = {
	action: ClientAction
	haptic: HapticType
	media: 'started' | 'stopped'
	'game-created': { gameId: string }
}

export type PlayerButtonHit = {
	playerId: string
	type: 'hit' | 'false-start'
}

export namespace ViewState {
	export type ExtendedPlayer = {
		pressedButton: 'hit' | 'false-start' | null
		active: boolean
	} & Player

	export type Controls =
		| { mode: 'hit'; ready: boolean; falselyStart: boolean }
		| { mode: 'appeal' }
		| { mode: 'answer-text' }
		| { mode: 'answer-select'; options: PackModel.SelectAnswerOption[] }
		| { mode: 'answer-attempt'; correct: boolean }

	export type RoundStage = {
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
		meActive: boolean
	}

	export type QuestionAwaitingAnswer = {
		type: 'in-progress' | 'correct' | 'incorrect'
		playerName: string
		avatarUrl?: string
		answer: string
		isMe: boolean
		timeoutSeconds: number
	}

	export type QuestionStage = {
		type: 'question'
		fragments: PackModel.FragmentGroup[]
		theme: string
		themeComment?: string
		readyForHit?: {
			ready: true
			timeoutSeconds: number
		}
		awaitingAnswer?: QuestionAwaitingAnswer
	}

	export type AnswerStage = {
		type: 'answer'
		theme: string
		model: PackModel.Answers
	}

	export type AppealStage = {
		type: 'appeal'
		model: PackModel.Question
		answer: string
		playerName: string
		agreePlayers: string[]
		disagreePlayers: string[]
		timeoutSeconds: number
		isMe: boolean
	}

	export type AppealResultStage = {
		type: 'appeal-result'
		resolution: boolean
	}

	export type View = {
		disconnected: boolean
		showPlayers: boolean
		players: ExtendedPlayer[]
		controls: Controls
		stageBlink: boolean
		stage:
			| { type: 'connecting' }
			| { type: 'before-start' }
			| RoundStage
			| QuestionStage
			| AnswerStage
			| AppealStage
			| AppealResultStage
			| { type: 'after-finish' }
	}
}
