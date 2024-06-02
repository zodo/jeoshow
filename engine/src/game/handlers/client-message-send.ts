import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'

const handleClientMessageSend = (
	state: GameState,
	command: ClientCommand.OfType<'message-send'>,
	ctx: CommandContext
): UpdateResult => {
	return {
		state,
		effects: [
			{
				type: 'client-broadcast',
				event: {
					type: 'player-sent-message',
					playerId: command.playerId,
					text: command.action.text,
				},
			},
		],
	}
}

export default handleClientMessageSend
