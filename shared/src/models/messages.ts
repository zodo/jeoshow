import type { Player, StageSnapshot } from './models'

export type ClientAction =
	| { type: 'introduce'; name: string; avatarUrl?: string }
	| { type: 'game-start' }
	| { type: 'question-select'; questionId: string }
	| { type: 'button-hit' }
	| { type: 'answer-give'; value: string }
	| { type: 'answer-typing'; value: string }
	| { type: 'media-finished' }
	| { type: 'appeal-vote'; vote: 'agree' | 'disagree' }
	| { type: 'round-skip'; vote: 'yes' | 'no' }
	| { type: 'ping-set'; ping: number }
	| { type: 'answer-skip' }
	| { type: 'message-send'; text: string }

export type GameEvent =
	| { type: 'player-hit-the-button'; playerId: string; falseStart: boolean }
	| { type: 'players-updated'; players: Player[] }
	| { type: 'stage-updated'; stage: StageSnapshot }
	| { type: 'player-typing'; playerId: string; value: string }
	| {
			type: 'answer-attempt'
			playerId: string
			answer: string
			correct: boolean
	  }
	| { type: 'player-sent-message'; playerId: string; text: string }
