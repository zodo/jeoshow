import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleClientAnswerSkip = (
	state: GameState,
	command: ClientCommand.OfType<'answer-skip'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'answer') {
		return {}
	}

	if (state.stage.votedForSkip.includes(command.playerId)) {
		return {}
	}

	const newVotedForSkip = [...state.stage.votedForSkip, command.playerId]
	const alivePlayers = state.players.filter((p) => !p.disconnected).length

	if (newVotedForSkip.length >= alivePlayers) {
		const callbackId: string = ctx.random().toString(36).substring(7)
		return {
			state: { ...state, stage: { ...state.stage, callbackId } },
			effects: [
				{
					type: 'trigger',
					command: {
						type: 'server',
						action: { type: 'round-return', callbackId },
					},
				},
			],
		}
	} else {
		const stage = { ...state.stage, votedForSkip: newVotedForSkip }
		return {
			state: { ...state, stage },
			effects: [],
		}
	}
}

export default handleClientAnswerSkip
