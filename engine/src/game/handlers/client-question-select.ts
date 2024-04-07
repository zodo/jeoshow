import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { getRound, toSnapshot } from '../state-utils'
import { getFragmentsTime } from '../timeouts'

const handleClientQuestionSelect = (
	state: GameState,
	command: ClientCommand.OfType<'question-select'>,
	ctx: CommandContext
): UpdateResult => {
	const stage = state.stage
	if (stage.type !== 'round') {
		return {}
	}
	const roundModel = getRound(ctx, stage.roundId)

	const question = roundModel.themes
		.flatMap((t) => t.questions)
		.find((q) => q.id === command.action.questionId)
	if (!question) {
		console.error('Question not found', command.action.questionId)
		return {}
	}
	if (
		stage.takenQuestions.includes(command.action.questionId) ||
		stage.activePlayer !== command.playerId ||
		!question
	) {
		return {}
	}

	const callbackId: string = Math.random().toString(36).substring(7)
	const fragmentsTime = getFragmentsTime(question.fragments)
	const questionReadTime = Math.floor(fragmentsTime + Math.random() * 4) + 1

	const newStage: Extract<Stage, { type: 'question' }> = {
		type: 'question',
		roundId: roundModel.id,
		activePlayer: command.playerId,
		questionId: question.id,
		previousAnswers: { questionId: question.id, answers: [], triedToAppeal: [] },
		takenQuestions: [...stage.takenQuestions, command.action.questionId],
		falseStartPlayers: [],
		questionReadTime,
		callbackId,
	}

	return {
		state: { ...state, stage: newStage },
		effects: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
			},
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: { type: 'button-ready', callbackId },
				},
				delaySeconds: Math.floor(questionReadTime / 2) + 1.5,
			},
		],
	}
}

export default handleClientQuestionSelect
