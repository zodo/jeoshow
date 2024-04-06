import type { Player, StageSnapshot } from './models'

export type ClientAction =
	| { type: 'introduce'; name: string; avatarUrl?: string }
	| { type: 'game-start' }
	| { type: 'question-select'; questionId: string }
	| { type: 'button-hit' }
	| { type: 'answer-give'; value: string }
	| { type: 'answer-typing'; value: string }
	| { type: 'media-finished' }
	| { type: 'appeal-start' }
	| { type: 'appeal-resolve'; resolution: boolean }

export type GameEvent =
	| { type: 'player-hit-the-button'; playerId: string }
	| { type: 'player-false-start'; playerId: string }
	| { type: 'players-updated'; players: Player[] }
	| { type: 'stage-updated'; stage: StageSnapshot }
	| { type: 'player-typing'; playerId: string; value: string }
	| {
			type: 'answer-attempt'
			playerId: string
			answer: string
			correct: boolean
	  }
