import type { ClientAction } from 'shared/models/commands'
import type { GameEvents } from 'shared/models/events'
import type { GameState } from './models'

export type ServerAction =
	| { type: 'player-disconnect'; playerId: string }
	| { type: 'button-ready'; callbackId?: string }
	| { type: 'button-hit-timeout'; callbackId: string }
	| { type: 'answer-show'; questionId?: string }
	| { type: 'answer-timeout'; callbackId: string }
	| { type: 'round-return' }
	| { type: 'question-random'; callbackId: string }

export type ServerCommand<A> = {
	type: 'server'
	action: A
}

export type ClientCommand<A> = {
	type: 'client'
	playerId: string
	action: A
}

export type GameCommand = ClientCommand<ClientAction> | ServerCommand<ServerAction>

type ClientActionOfType<T extends ClientAction['type']> = Extract<ClientAction, { type: T }>
export type ClientCommandOfType<T extends ClientAction['type']> = ClientCommand<
	ClientActionOfType<T>
>

type ServerActionOfType<T extends ServerAction['type']> = Extract<ServerAction, { type: T }>
export type ServerCommandOfType<T extends ServerAction['type']> = ServerCommand<
	ServerActionOfType<T>
>

export type UpdateEvent =
	| { type: 'client-broadcast'; event: GameEvents.GameEvent }
	| { type: 'client-reply'; event: GameEvents.GameEvent }
	| { type: 'schedule'; command: GameCommand; delaySeconds: number }
	| { type: 'trigger'; command: GameCommand }

export interface UpdateResult {
	state?: GameState
	events?: UpdateEvent[]
}

export interface ScheduledCommand {
	command: GameCommand
	time: number
}
