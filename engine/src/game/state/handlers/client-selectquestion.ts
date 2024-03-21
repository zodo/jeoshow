import { toSnapshot, type GameState, type Stage } from '../models'
import type { ClientCommandOfType, UpdateResult } from '../state-machine-models'

const handleClientSelectQuestion = (
	state: GameState,
	command: ClientCommandOfType<'SelectQuestion'>
): UpdateResult => {
	const stage = state.stage
	if (stage.type !== 'Round') {
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

	const newStage: Extract<Stage, { type: 'Question' }> = {
		...stage,
		type: 'Question',
		questionModel: question,
		previousAnswers: { triedToAppeal: [], answers: [] },
	}

	return {
		state: { ...state, stage: newStage },
		events: [
			{
				type: 'broadcast',
				event: { type: 'StageUpdated', stage: toSnapshot(newStage) },
			},
		],
	}
}

export default handleClientSelectQuestion
