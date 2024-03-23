import type { PackModel } from 'shared/models/siq'
import { toSnapshot, type GameState, type Stage } from '../models'
import type { ClientCommandOfType, UpdateResult } from '../state-machine-models'
import { getFragmentsTime } from '../timeouts'

const handleClientQuestionSelect = (
	state: GameState,
	command: ClientCommandOfType<'question-select'>
): UpdateResult => {
	const stage = state.stage
	if (stage.type !== 'round') {
		return {}
	}

	const question = stage.roundModel.themes
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

	const newStage: Extract<Stage, { type: 'question' }> = {
		type: 'question',
		roundModel: stage.roundModel,
		activePlayer: command.playerId,
		questionModel: question,
		previousAnswers: { model: question, answers: [] },
		takenQuestions: [...stage.takenQuestions, command.action.questionId],
		falseStartPlayers: [],
		callbackId,
	}

	const fragmentsTime = getFragmentsTime(question.fragments)
	const questionReadTime = Math.floor(fragmentsTime / 2 + Math.random() * 3)

	return {
		state: { ...state, stage: newStage },
		events: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(newStage) },
			},
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: { type: 'button-ready', callbackId },
				},
				delaySeconds: questionReadTime,
			},
		],
	}
}

export default handleClientQuestionSelect
