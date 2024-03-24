import { toSnapshot, type GameState, type Stage } from '../models'
import {
	type ClientCommandOfType,
	type CommandContext,
	type UpdateResult,
} from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleClientAppealStart = (
	state: GameState,
	command: ClientCommandOfType<'appeal-start'>,
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
		events: [
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
