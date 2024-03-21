import type { GameState } from './models'
import type {
	ClientCommandOfType,
	GameCommand,
	ServerCommandOfType,
	UpdateResult,
} from './state-machine-models'
import handleClientIntroduce from './handlers/client-introduce'
import handleClientStartGame from './handlers/client-startgame'
import handleClientHitButton from './handlers/client-hitbutton'
import handleServerDisconnect from './handlers/server-disconnect'

export const updateState = (state: GameState, command: GameCommand): UpdateResult => {
	switch (command.type) {
		case 'client':
			switch (command.action.type) {
				case 'Introduce':
					return handleClientIntroduce(state, command as ClientCommandOfType<'Introduce'>)
				case 'StartGame':
					return handleClientStartGame(state, command as ClientCommandOfType<'StartGame'>)
				case 'HitButton':
					return handleClientHitButton(state, command as ClientCommandOfType<'HitButton'>)
				default:
					console.error('Unknown client action', command)
					return { state, events: [] }
			}
		case 'server': {
			switch (command.action.type) {
				case 'disconnect':
					return handleServerDisconnect(
						state,
						command as ServerCommandOfType<'disconnect'>
					)
				default:
					console.error('Unknown server action', command)
					return { state, events: [] }
			}
		}
	}
}
