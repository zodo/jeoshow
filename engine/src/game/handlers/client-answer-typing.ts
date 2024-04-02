import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleClientAnswerTyping = (
	state: GameState,
	command: ClientCommand.OfType<'answer-typing'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		state.stage.type !== 'awaiting-answer' ||
		command.playerId !== state.stage.answeringPlayer
	) {
		return {}
	}

	return {
		effects: [
			{
				type: 'client-broadcast',
				event: {
					type: 'player-typing',
					playerId: command.playerId,
					value: command.action.value,
				},
			},
		],
	}
}

export default handleClientAnswerTyping
