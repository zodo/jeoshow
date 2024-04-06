import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleClientAppealStart = (
	state: GameState,
	command: ClientCommand.OfType<'appeal-start'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'round' ||
		!state.stage.previousAnswers.answers.map((a) => a.playerId).includes(command.playerId) ||
		!state.stage.previousAnswers.questionId
	) {
		return {}
	}

	const callbackId: string = Math.random().toString(36).substring(7)

	const playerAnswer = state.stage.previousAnswers.answers.find(
		(a) => a.playerId === command.playerId
	)?.text

	const newStage: Extract<Stage, { type: 'appeal' }> = {
		...state.stage,
		type: 'appeal',
		questionId: state.stage.previousAnswers.questionId,
		answer: playerAnswer ?? '',
		playerId: command.playerId,
		resolutions: {},
		callbackTimeout: Timeouts.appealTimeout,
		previousAnswers: {
			...state.stage.previousAnswers,
			triedToAppeal: [...state.stage.previousAnswers.triedToAppeal, command.playerId],
		},
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
					action: { type: 'round-return', callbackId },
				},
				delaySeconds: Timeouts.appealTimeout,
			},
		],
	}
}

export default handleClientAppealStart
