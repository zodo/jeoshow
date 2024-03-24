import type { ClientAction } from 'shared/models/commands'
import type { GameEvents } from 'shared/models/events'

export type SvelteCustomEvent = {
	action: ClientAction
}

export type ExtendedPlayer = {
	pressedButton: 'hit' | 'false-start' | null
	active: boolean
	messages: string[]
} & GameEvents.Player
