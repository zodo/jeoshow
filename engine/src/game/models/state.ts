import { PackModel } from 'shared/models/siq'
import { QuestionSubstate, StageSnapshot } from 'shared/models/events'

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
	model: PackModel.Round
	takenQuestions: number[]
	activePlayer: string
	previousAnswers: AnswersSummary
}

type RoundStageType =
	| { type: 'Round' }
	| { type: 'Question'; model: PackModel.Question }
	| { type: 'ReadyForHit'; model: PackModel.Question }
	| {
			type: 'AwaitingAnswer'
			model: PackModel.Question
			answeringPlayer: string
	  }
	| { type: 'Answer'; model: PackModel.Answers }
	| {
			type: 'Appeal'
			model: PackModel.Question
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

export const toSnapshot = (stage: Stage): StageSnapshot => {
	switch (stage.type) {
		case 'BeforeStart':
			return { type: 'BeforeStart' }
		case 'Round':
			return {
				type: 'Round',
				name: stage.model.name,
				themes: [
					...stage.model.themes.map((t) => ({
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
			let substate: QuestionSubstate
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
				fragments: stage.model.fragments,
				price: stage.model.price,
				theme: stage.model.theme,
				substate: substate,
			}
		case 'Answer':
			return {
				type: 'Answer',
				model: stage.model,
			}
		case 'Appeal':
			return {
				type: 'Appeal',
				model: stage.model,
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
