import { toSnapshot, type GameState, type Stage } from '../models'
import type { ClientCommandOfType, UpdateResult } from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleClientQuestionSelect = (
	state: GameState,
	command: ClientCommandOfType<'question-select'>
): UpdateResult => {
	const stage = state.stage
	if (stage.type !== 'round') {
		return { state, events: [] }
	}

	const question = stage.roundModel.themes
		.flatMap((t) => t.questions)
		.find((q) => q.id === command.action.questionId)
	if (
		stage.takenQuestions.includes(command.action.questionId) ||
		stage.activePlayer !== command.playerId ||
		!question
	) {
		return { state, events: [] }
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
				delaySeconds: Timeouts.readQuestionLimit,
			},
		],
	}
}

export default handleClientQuestionSelect
