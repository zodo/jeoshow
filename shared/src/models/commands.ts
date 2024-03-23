export type ClientAction =
	| { type: 'introduce'; name: string }
	| { type: 'game-start' }
	| { type: 'question-select'; questionId: string }
	| { type: 'button-hit' }
	| { type: 'answer-give'; value: string }
	| { type: 'media-finished'; questionId: string }
	| { type: 'start-appeal' }
	| { type: 'resolve-appeal'; resolution: boolean }
