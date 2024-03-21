import type { PackModel } from 'shared/models/siq'
import type { GameEvents } from 'shared/models/events'

type PlayerId = string

export interface GameState {
	pack: PackModel.Pack
	mediaMapping: Record<string, string>
	players: Player[]
	stage: Stage
}

export interface Player {
	id: PlayerId
	name: string
	score: number
	disconnected: boolean
}

export interface Countdown {
	max: number
	finishesAt: number
}

export type Stage = { type: 'BeforeStart' } | (RoundStageType & RoundStageBase)

export interface RoundStageBase {
	roundModel: PackModel.Round
	takenQuestions: string[]
	activePlayer: string
	previousAnswers: AnswersSummary
}

type RoundStageType =
	| { type: 'Round' }
	| { type: 'Question'; questionModel: PackModel.Question }
	| { type: 'ReadyForHit'; questionModel: PackModel.Question }
	| {
			type: 'AwaitingAnswer'
			questionModel: PackModel.Question
			answeringPlayer: string
	  }
	| { type: 'Answer'; answerModel: PackModel.Answers }
	| {
			type: 'Appeal'
			questionModel: PackModel.Question
			answer: string
			playerId: PlayerId
			resolutions: Record<PlayerId, boolean>
	  }
	| { type: 'AppealResult'; resolution: boolean }

export interface AnswersSummary {
	model?: PackModel.Question
	answers: PlayerAnswer[]
	triedToAppeal: PlayerId[]
}

export interface PlayerAnswer {
	playerId: PlayerId
	text: string
	isCorrect: boolean
	scoreDiff: number
}

export const toSnapshot = (stage: Stage): GameEvents.StageSnapshot => {
	switch (stage.type) {
		case 'BeforeStart':
			return { type: 'BeforeStart' }
		case 'Round':
			return {
				type: 'Round',
				name: stage.roundModel.name,
				themes: [
					...stage.roundModel.themes.map((t) => ({
						name: t.name,
						questions: t.questions.map((q) => ({
							id: q.id,
							price: q.price,
							available: stage.takenQuestions.indexOf(q.id) < 0,
						})),
					})),
				],
				activePlayerId: stage.activePlayer,
			}
		case 'Question':
		case 'ReadyForHit':
		case 'AwaitingAnswer':
			let substate: GameEvents.QuestionState
			switch (stage.type) {
				case 'Question':
					substate = { type: 'Idle' }
					break
				case 'ReadyForHit':
					substate = { type: 'ReadyForHit' }
					break
				case 'AwaitingAnswer':
					substate = { type: 'AwaitingAnswer', activePlayerId: stage.answeringPlayer }
					break
			}

			return {
				type: 'Question',
				fragments: stage.questionModel.fragments,
				price: stage.questionModel.price,
				theme: stage.roundModel.themes.find((t) =>
					t.questions.some((q) => q.id === stage.questionModel.id)
				)!.name,
				substate: substate,
			}
		case 'Answer':
			return {
				type: 'Answer',
				model: stage.answerModel,
			}
		case 'Appeal':
			return {
				type: 'Appeal',
				model: stage.questionModel,
				answer: stage.answer,
				playerId: stage.playerId,
				resolutions: stage.resolutions,
			}
		case 'AppealResult':
			return {
				type: 'AppealResult',
				resolution: stage.resolution,
			}
	}
}
