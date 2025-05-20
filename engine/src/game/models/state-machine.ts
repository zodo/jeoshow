import type { GameEvent } from 'shared/models/messages'
import type { GameState } from './state'
import type { GameCommand } from './state-commands'
import type { PackModel } from 'shared/models/siq'

export type StateMachine = (
	state: GameState,
	command: GameCommand,
	context: CommandContext
) => UpdateResult

export type UpdateEffect =
	| { type: 'client-broadcast'; event: GameEvent }
	| { type: 'client-reply'; event: GameEvent }
	| { type: 'schedule'; command: GameCommand; delaySeconds: number }
	| { type: 'trigger'; command: GameCommand }

export interface UpdateResult {
	state?: GameState
	effects?: UpdateEffect[]
}

export type CommandContext = {
	pack: PackModel.Pack
	mediaMapping: Record<string, string>
	now: number
}
