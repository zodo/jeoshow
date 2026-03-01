import type { GameState, Stage } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleServerPartyLlmVerdict = (
	state: GameState,
	command: ServerCommand.OfType<'party-llm-verdict'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'party-checking' ||
		state.stage.callbackId !== command.action.callbackId
	) {
		return { state, effects: [] }
	}

	const sub = state.stage.submissions.find((s) => s.playerId === command.action.playerId)
	if (!sub) {
		return { state, effects: [] }
	}

	const newVerdicts = [
		...state.stage.verdicts,
		{
			playerId: command.action.playerId,
			answer: sub.answerText,
			correct: command.action.correct,
			scoreDiff: 0, // calculated in verdicts-ready
			confidenceBet: sub.confidenceBet,
		},
	]

	const newPending = state.stage.pendingVerdicts - 1

	const newStage: Extract<Stage, { type: 'party-checking' }> = {
		...state.stage,
		verdicts: newVerdicts,
		pendingVerdicts: newPending,
	}

	if (newPending <= 0) {
		return {
			state: { ...state, stage: newStage },
			effects: [
				{
					type: 'trigger',
					command: {
						type: 'server',
						action: { type: 'party-verdicts-ready', callbackId: state.stage.callbackId! },
					},
				},
			],
		}
	}

	return {
		state: { ...state, stage: newStage },
		effects: [],
	}
}

export default handleServerPartyLlmVerdict
