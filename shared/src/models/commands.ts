export type ClientAction =
	| { type: 'introduce'; name: string }
	| { type: 'game-start' }
	| { type: 'question-select'; questionId: string }
	| { type: 'button-hit' }
	| { type: 'answer-give'; value: string }
	| { type: 'media-finished' }
	| { type: 'appeal-start' }
	| { type: 'appeal-resolve'; resolution: boolean }
