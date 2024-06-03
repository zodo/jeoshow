import type { PackModel } from 'shared/models/siq'
import type { AnswersSummary, GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateEffect, UpdateResult } from '../models/state-machine'
import { getQuestion, toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'
import { assertNever } from 'shared/utils/assert-never'

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
	const answerType = questionModel.answers.type
	let playerAnswerText: string
	if (answerType === 'regular') {
		playerAnswerText = command.action.value
	} else if (answerType === 'select') {
		playerAnswerText =
			questionModel.answers.options.find((o) => o.name === command.action.value)?.text ?? 'хз'
	} else {
		assertNever(questionModel.answers)
	}

	const isCorrectAnswer = isCorrect(questionModel.answers, command.action.value)
	const players = state.players.map((p) =>
		p.id === command.playerId
			? {
					...p,
					answerAttemts: p.answerAttemts + 1,
					score: isCorrectAnswer
						? p.score + questionModel.price
						: p.score - questionModel.price,
				}
			: p
	)

	const previousAnswers: AnswersSummary = {
		...state.stage.previousAnswers,
		answers: [
			...state.stage.previousAnswers.answers,
			{
				playerId: command.playerId,
				text: playerAnswerText,
				isCorrect: isCorrectAnswer,
				scoreDiff: isCorrectAnswer ? questionModel.price : -questionModel.price,
			},
		],
	}

	const callbackId = Math.random().toString(36).substring(7)

	const allowAnswersFromOtherPlayers =
		!isCorrectAnswer &&
		((answerType === 'select' &&
			previousAnswers.answers.length < questionModel.answers.options.length - 1) ||
			answerType === 'regular') &&
		previousAnswers.answers.length < state.players.filter((p) => !p.disconnected).length
	console.log(
		JSON.stringify(
			{
				allowAnswersFromOtherPlayers,
				isCorrectAnswer,
				answerType,
				answersLength: previousAnswers.answers.length,
				playersLength: state.players.filter((p) => !p.disconnected).length,
			},
			null,
			2
		)
	)

	const stage: Extract<Stage, { type: 'answer-attempt' }> = {
		...state.stage,
		type: 'answer-attempt',
		previousAnswers,
		callbackId,
		activePlayer: isCorrectAnswer ? command.playerId : state.stage.activePlayer,
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
				type: 'client-broadcast',
				event: {
					type: 'answer-attempt',
					playerId: command.playerId,
					answer: playerAnswerText,
					correct: isCorrectAnswer,
				},
			},
			{
				type: 'client-broadcast',
				event: {
					type: 'player-sent-message',
					playerId: command.playerId,
					text: playerAnswerText,
				},
			},
			allowAnswersFromOtherPlayers
				? {
						type: 'schedule',
						command: {
							type: 'server',
							action: { type: 'button-ready', callbackId },
						},
						delaySeconds: Timeouts.answerAttemptShow,
					}
				: {
						type: 'trigger',
						command: {
							type: 'server',
							action: { type: 'answer-show', questionId: questionModel.id },
						},
					},
		],
	}
}

const isCorrect = (correctAnswer: PackModel.Answers, actualAnswer: string) => {
	if (correctAnswer.type === 'regular') {
		const sanitize = (s: string) =>
			s
				.replace(/[^\p{L}\p{N}]+/gu, '')
				.replace('ё', 'е')
				.replace('й', 'и')
				.toLowerCase()

		return correctAnswer.correct.map(sanitize).includes(sanitize(actualAnswer))
	} else if (correctAnswer.type === 'select') {
		return actualAnswer === correctAnswer.correctName
	} else {
		assertNever(correctAnswer)
	}
}

export default handleClientAnswerGive
