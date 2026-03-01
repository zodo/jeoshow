import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateEffect, UpdateResult } from '../models/state-machine'

const handleClientPartyPass = (
	state: GameState,
	command: ClientCommand.OfType<'party-pass'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'party-question') {
		return { state, effects: [] }
	}

	if (state.stage.submissions.some((s) => s.playerId === command.playerId)) {
		return { state, effects: [] }
	}

	const newStage: Extract<Stage, { type: 'party-question' }> = {
		...state.stage,
		submissions: [
			...state.stage.submissions,
			{
				playerId: command.playerId,
				answer: '',
				answerText: '',
				submittedAt: ctx.now,
				passed: true,
				confidenceBet: false,
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

export default handleClientPartyPass
