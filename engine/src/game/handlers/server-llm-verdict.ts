import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { getQuestion } from '../state-utils'
import { resolveAnswer } from './client-answer-give'

const handleServerLlmVerdict = (
	state: GameState,
	command: ServerCommand.OfType<'llm-verdict'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'llm-checking' ||
		state.stage.callbackId !== command.action.callbackId
	) {
		return { state, effects: [] }
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)

	return resolveAnswer({
		state,
		command: { playerId: state.stage.answeringPlayer },
		ctx,
		questionModel,
		playerAnswerText: state.stage.playerAnswerText,
		isCorrectAnswer: command.action.correct,
	})
}

export default handleServerLlmVerdict
