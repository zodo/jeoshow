import type { GameEvents } from 'shared/models/events'
import { writable } from 'svelte/store'

export const playersStore = writable<GameEvents.Player[]>([])

export const gameStageStore = writable<GameEvents.StageSnapshot | null>(null)

export const hitButtonStore = writable<string[]>([])

export const handleGameEvent = (event: GameEvents.GameEvent) => {
	switch (event.type) {
		case 'PlayersUpdated':
			playersStore.set(event.players)
			break
		case 'StageUpdated':
			gameStageStore.set(event.stage)
			break
		case 'PlayerHitTheButton':
			hitButtonStore.update((players) => [...players, event.playerId])
			setTimeout(() => {
				hitButtonStore.update((players) => players.filter((p) => p !== event.playerId))
			}, 100)
			break
		case 'PlayerGaveAnswer':
			break
	}
}
