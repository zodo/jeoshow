import type { PackModel } from 'shared/models/siq'
import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
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
	if (isCorrect(questionModel.answers, command.action.value)) {
		const players = state.players.map((p) =>
			p.id === command.playerId ? { ...p, score: p.score + questionModel.price } : p
		)
		const stage: Extract<Stage, { type: 'answer-attempt' }> = {
			...state.stage,
			type: 'answer-attempt',
			activePlayer: command.playerId,
			answer: playerAnswerText,
			correct: true,
			previousAnswers: {
				...state.stage.previousAnswers,
				answers: [
					...state.stage.previousAnswers.answers,
					{
						playerId: command.playerId,
						text: playerAnswerText,
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
			answer: playerAnswerText,
			correct: false,
			previousAnswers: {
				...state.stage.previousAnswers,
				answers: [
					...state.stage.previousAnswers.answers,
					{
						playerId: command.playerId,
						text: playerAnswerText,
						isCorrect: false,
						scoreDiff: -questionModel.price,
					},
				],
			},
			callbackId,
		}

		const showButtonOneMoreTime =
			((answerType === 'select' &&
				state.stage.previousAnswers.answers.length <
					questionModel.answers.options.length - 2) ||
				answerType === 'regular') &&
			state.stage.previousAnswers.answers.length <
				state.players.filter((p) => !p.disconnected).length - 1

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
				showButtonOneMoreTime
					? {
							type: 'schedule',
							command: {
								type: 'server',
								action: { type: 'button-ready', callbackId },
							},
							delaySeconds: Timeouts.answerAttemptShow,
						}
					: {
							type: 'schedule',
							command: {
								type: 'server',
								action: { type: 'answer-show', questionId: questionModel.id },
							},
							delaySeconds: Timeouts.answerAttemptShow,
						},
			],
		}
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
