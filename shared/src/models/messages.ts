import type { Player, StageSnapshot } from './models'

export type ClientAction =
	| { type: 'introduce'; name: string }
	| { type: 'game-start' }
	| { type: 'question-select'; questionId: string }
	| { type: 'button-hit' }
	| { type: 'answer-give'; value: string }
	| { type: 'media-finished' }
	| { type: 'appeal-start' }
	| { type: 'appeal-resolve'; resolution: boolean }

export type GameEvent =
	| { type: 'player-hit-the-button'; playerId: string }
	| { type: 'player-false-start'; playerId: string }
	| { type: 'player-texted'; playerId: string; text: string }
	| { type: 'players-updated'; players: Player[] }
	| { type: 'stage-updated'; stage: StageSnapshot }