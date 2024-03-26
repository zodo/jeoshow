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
	}

	return {
		state: { ...state, stage: newStage },
		effects: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
			},
			...state.players.map(
				(p) =>
					({
						type: 'schedule',
						command: {
							type: 'client',
							action: {
								type: 'appeal-resolve',
								resolution: false,
							},
							playerId: p.id,
						},
						delaySeconds: Timeouts.appealTimeout,
					}) as const
			),
		],
	}
}

export default handleClientAppealStart
