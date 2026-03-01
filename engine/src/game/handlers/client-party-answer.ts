import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateEffect, UpdateResult } from '../models/state-machine'
import { getQuestion } from '../state-utils'
import { assertNever } from 'shared/utils/assert-never'

const handleClientPartyAnswer = (
	state: GameState,
	command: ClientCommand.OfType<'party-answer'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'party-question') {
		return { state, effects: [] }
	}

	if (state.stage.submissions.some((s) => s.playerId === command.playerId)) {
		return { state, effects: [] }
	}

	const questionModel = getQuestion(ctx, state.stage.questionId)
	const answerType = questionModel.answers.type
	let answerText: string
	if (answerType === 'regular') {
		answerText = command.action.value
	} else if (answerType === 'select') {
		answerText =
			questionModel.answers.options.find((o) => o.name === command.action.value)?.text ?? 'хз'
	} else {
		assertNever(questionModel.answers)
	}

	const newStage: Extract<Stage, { type: 'party-question' }> = {
		...state.stage,
		submissions: [
			...state.stage.submissions,
			{
				playerId: command.playerId,
				answer: command.action.value,
				answerText,
				submittedAt: ctx.now,
				passed: false,
				confidenceBet: command.action.confidenceBet,
			},
		],
	}

	const alivePlayers = state.players.filter((p) => !p.disconnected)
	const allSubmitted = newStage.submissions.length >= alivePlayers.length

	const effects: UpdateEffect[] = [
		{
			type: 'client-broadcast',
			event: { type: 'party-submission', playerId: command.playerId },
		},
	]

	if (allSubmitted) {
		effects.push({
			type: 'trigger',
			command: {
				type: 'server',
				action: { type: 'party-answer-timeout', callbackId: state.stage.callbackId! },
			},
		})
	}

	return {
		state: { ...state, stage: newStage },
		effects,
	}
}

export default handleClientPartyAnswer
