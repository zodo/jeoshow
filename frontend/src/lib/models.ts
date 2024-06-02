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

export type PlayerMessage = {
	id: string
	playerId: string
	text: string
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
		| { mode: 'answer-skip'; totalPlayers: number; votes: number; meVoted: boolean }

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
		skipRoundVoting?: {
			timeoutSeconds: number
			meVoted: boolean
			yes: string[]
			no: string[]
		}
		appealVoting?: {
			correctAnswers: string[]
			answer: string
			playerName: string
			agree: string[]
			disagree: string[]
			timeoutSeconds: number
			meVoted: boolean
		}
		appealResolution?: 'approved' | 'rejected'
	}

	export type AnswerAttempt = {
		type: 'in-progress' | 'correct' | 'incorrect'
		playerName: string
		avatarUrl?: string
		answer: string
		isMe: boolean
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
		awaitingAnswerTimeoutSeconds?: number
		showIntroduction: boolean
		price: number
	}

	export type AnswerStage = {
		type: 'answer'
		theme: string
		model: PackModel.Answers
	}

	export type ChatMessage = {
		id: string
		player: Player
		text: string
	}

	export type View = {
		disconnected: boolean
		showPlayers: boolean
		players: ExtendedPlayer[]
		controls: Controls
		stageBlink: boolean
		answerAttempt?: AnswerAttempt
		messages: ChatMessage[]
		stage:
			| { type: 'connecting' }
			| { type: 'before-start' }
			| RoundStage
			| QuestionStage
			| AnswerStage
			| { type: 'after-finish' }
	}
}
