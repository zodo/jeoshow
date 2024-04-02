import type { PackModel } from 'shared/models/siq'
import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { getQuestion, toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleClientAnswerGive = (
	state: GameState,
	command: ClientCommand.OfType<'answer-give'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'awaiting-answer' ||
		command.playerId !== state.stage.answeringPlayer
	) {
		return { state, effects: [] }
	}
	const questionModel = getQuestion(ctx, state.stage.questionId)
	if (isCorrect(questionModel.answers, command.action.value)) {
		const players = state.players.map((p) =>
			p.id === command.playerId ? { ...p, score: p.score + questionModel.price } : p
		)
		const stage: Extract<Stage, { type: 'answer-attempt' }> = {
			...state.stage,
			type: 'answer-attempt',
			activePlayer: command.playerId,
			answer: command.action.value,
			correct: true,
			previousAnswers: {
				...state.stage.previousAnswers,
				answers: [
					...state.stage.previousAnswers.answers,
					{
						playerId: command.playerId,
						text: command.action.value,
						isCorrect: true,
						scoreDiff: questionModel.price,
					},
				],
			},
		}

		return {
			state: { ...state, players, stage },
			effects: [
				{
					type: 'client-broadcast',
					event: {
						type: 'players-updated',
						players,
					},
				},
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(stage, ctx) },
				},
				{
					type: 'schedule',
					command: {
						type: 'server',
						action: { type: 'answer-show', questionId: questionModel.id },
					},
					delaySeconds: Timeouts.answerAttemptShow,
				},
			],
		}
	} else {
		const players = state.players.map((p) =>
			p.id === command.playerId ? { ...p, score: p.score - questionModel.price } : p
		)
		const callbackId = Math.random().toString(36).substring(7)
		const stage: Extract<Stage, { type: 'answer-attempt' }> = {
			...state.stage,
			type: 'answer-attempt',
			answer: command.action.value,
			correct: false,
			previousAnswers: {
				...state.stage.previousAnswers,
				answers: [
					...state.stage.previousAnswers.answers,
					{
						playerId: command.playerId,
						text: command.action.value,
						isCorrect: false,
						scoreDiff: -questionModel.price,
					},
				],
			},
			callbackId,
		}

		return {
			state: { ...state, players, stage },
			effects: [
				{
					type: 'client-broadcast',
					event: {
						type: 'players-updated',
						players,
					},
				},
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(stage, ctx) },
				},
				{
					type: 'schedule',
					command: {
						type: 'server',
						action: { type: 'button-ready', callbackId },
					},
					delaySeconds: Timeouts.answerAttemptShow,
				},
			],
		}
	}
}

const isCorrect = (correctAnswer: PackModel.Answers, actualAnswer: string) => {
	console.log('correctAnswer', JSON.stringify(correctAnswer))
	console.log('actualAnswer', JSON.stringify(actualAnswer))
	const sanitize = (s: string) => s.replace(/[^\p{L}\p{N}]+/gu, '').toLowerCase()

	return correctAnswer.correct.map(sanitize).includes(sanitize(actualAnswer))
}

export default handleClientAnswerGive
