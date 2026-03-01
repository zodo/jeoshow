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
import handleClientAnswerGive from './handlers/client-answer-give'
import handleServerAnswerTimeout from './handlers/server-answer-timeout'
import handleClientMediaFinished from './handlers/client-media-finished'
import handleClientAnswerTyping from './handlers/client-answer-typing'
import handleServerButtonHitChoose from './handlers/server-button-hit-choose'
import handleRoundSkip from './handlers/client-round-skip'
import handleClientAppealVote from './handlers/client-appeal-vote'
import handlePingSet from './handlers/client-ping-set'
import handleClientAnswerSkip from './handlers/client-answer-skip'
import handleClientMessageSend from './handlers/client-message-send'
import handleServerFireStageUpdate from './handlers/server-fire-stage-update'
import handleServerLlmVerdict from './handlers/server-llm-verdict'
import handleClientPartyAnswer from './handlers/client-party-answer'
import handleClientPartyPass from './handlers/client-party-pass'
import handleClientPartyRevealReady from './handlers/client-party-reveal-ready'
import handleServerPartyAnswerTimeout from './handlers/server-party-answer-timeout'
import handleServerPartyLlmVerdict from './handlers/server-party-llm-verdict'
import handleServerPartyRevealTimeout from './handlers/server-party-reveal-timeout'
import handleServerPartyVerdictsReady from './handlers/server-party-verdicts-ready'

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
	'answer-give': handleClientAnswerGive,
	'answer-typing': handleClientAnswerTyping,
	'media-finished': handleClientMediaFinished,
	'appeal-vote': handleClientAppealVote,
	'round-skip': handleRoundSkip,
	'ping-set': handlePingSet,
	'answer-skip': handleClientAnswerSkip,
	'message-send': handleClientMessageSend,
	'party-answer': handleClientPartyAnswer,
	'party-pass': handleClientPartyPass,
	'party-reveal-ready': handleClientPartyRevealReady,
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
	'button-hit-choose': handleServerButtonHitChoose,
	'answer-timeout': handleServerAnswerTimeout,
	'fire-stage-update': handleServerFireStageUpdate,
	'llm-verdict': handleServerLlmVerdict,
	'party-answer-timeout': handleServerPartyAnswerTimeout,
	'party-verdicts-ready': handleServerPartyVerdictsReady,
	'party-reveal-timeout': handleServerPartyRevealTimeout,
	'party-llm-verdict': handleServerPartyLlmVerdict,
	'state-cleanup': () => ({}), // handled by caller code
}
