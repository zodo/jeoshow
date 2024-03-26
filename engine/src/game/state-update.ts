import type { ClientAction } from 'shared/models/messages'
import type { GameState } from './models/state'
import type {
	ClientCommand,
	GameCommand,
	ServerAction,
	ServerCommand,
} from './models/state-commands'
import type { CommandContext, UpdateResult } from './models/state-machine'

import handleClientIntroduce from './handlers/client-introduce'
import handleClientGameStart from './handlers/client-game-start'
import handleClientButtonHit from './handlers/client-button-hit'
import handlePlayerDisconnect from './handlers/server-player-disconnect'
import handleClientQuestionSelect from './handlers/client-question-select'
import handleServerButtonReady from './handlers/server-button-ready'
import handleServerAnswerShow from './handlers/server-answer-show'
import handleServerQuestionRandom from './handlers/server-question-random'
import handleServerRoundReturn from './handlers/server-round-return'
import handleServerButtonHitTimeout from './handlers/server-button-hit-timeout'
import handleClientGiveAnswer from './handlers/client-answer-give'
import handleServerAnswerTimeout from './handlers/server-answer-timeout'
import handleClientMediaFinished from './handlers/client-media-finished'
import handleClientAppealStart from './handlers/client-appeal-start'
import handleClientAppealResolve from './handlers/client-appeal-resolve'

export const updateState = (
	state: GameState,
	command: GameCommand,
	ctx: CommandContext
): UpdateResult => {
	switch (command.type) {
		case 'client':
			return clientCommandHandlers[command.action.type](state, command as any, ctx)
		case 'server':
			return serverCommandHandlers[command.action.type](state, command as any, ctx)
	}
}

const clientCommandHandlers: {
	[K in ClientAction['type']]: (
		state: GameState,
		command: ClientCommand.OfType<K>,
		ctx: CommandContext
	) => UpdateResult
} = {
	introduce: handleClientIntroduce,
	'game-start': handleClientGameStart,
	'button-hit': handleClientButtonHit,
	'question-select': handleClientQuestionSelect,
	'answer-give': handleClientGiveAnswer,
	'media-finished': handleClientMediaFinished,
	'appeal-start': handleClientAppealStart,
	'appeal-resolve': handleClientAppealResolve,
}

const serverCommandHandlers: {
	[K in ServerAction['type']]: (
		state: GameState,
		command: ServerCommand.OfType<K>,
		ctx: CommandContext
	) => UpdateResult
} = {
	'player-disconnect': handlePlayerDisconnect,
	'button-ready': handleServerButtonReady,
	'answer-show': handleServerAnswerShow,
	'question-random': handleServerQuestionRandom,
	'round-return': handleServerRoundReturn,
	'button-hit-timeout': handleServerButtonHitTimeout,
	'answer-timeout': handleServerAnswerTimeout,
	'state-cleanup': (s, c, t) => {
		throw new Error('Should not be called')
	},
}
