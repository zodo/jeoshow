import type { ClientAction } from 'shared/models/messages'
import type { Player } from 'shared/models/models'

export type SvelteCustomEvent = { action: ClientAction }

export type ExtendedPlayer = {
	pressedButton: 'hit' | 'false-start' | null
	active: boolean
	messages: string[]
} & Player

export type PlayerMessage = { playerId: string; text: string }

export type PlayerButtonHit = { playerId: string; type: 'hit' | 'false-start' }
