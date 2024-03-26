import type { ClientAction } from 'shared/models/messages'

export type ServerAction =
	| { type: 'player-disconnect'; playerId: string }
	| { type: 'button-ready'; callbackId?: string }
	| { type: 'button-hit-timeout'; callbackId: string }
	| { type: 'answer-show'; questionId?: string }
	| { type: 'answer-timeout'; callbackId: string }
	| { type: 'round-return' }
	| { type: 'question-random'; callbackId: string }
	| { type: 'state-cleanup' }

export type ServerCommand<A extends ServerAction> = {
	type: 'server'
	action: A
}

export type ClientCommand<A extends ClientAction> = {
	type: 'client'
	playerId: string
	action: A
}

export type GameCommand = ClientCommand<ClientAction> | ServerCommand<ServerAction>

export namespace ServerCommand {
	export type OfType<T extends ServerAction['type']> = ServerCommand<
		Extract<ServerAction, { type: T }>
	>
}

export namespace ClientCommand {
	export type OfType<T extends ClientAction['type']> = ClientCommand<
		Extract<ClientAction, { type: T }>
	>
}

export interface ScheduledCommand {
	command: GameCommand
	time: number
}
