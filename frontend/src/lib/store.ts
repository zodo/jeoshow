import type { GameEvents } from 'shared/models/events'
import { derived, writable } from 'svelte/store'

export const playersStore = writable<GameEvents.Player[]>([])

export const gameStageStore = writable<GameEvents.StageSnapshot | null>(null)

export const hitButtonStore = writable<string[]>([])

export const activePlayerIdStore = derived(gameStageStore, ($gameStageStore) => {
	if ($gameStageStore?.type === 'Round') {
		return $gameStageStore.activePlayerId
	} else if (
		$gameStageStore?.type === 'Question' &&
		$gameStageStore.substate.type === 'AwaitingAnswer'
	) {
		return $gameStageStore.substate.activePlayerId
	} else if ($gameStageStore?.type === 'Appeal') {
		return $gameStageStore.playerId
	}
	return null
})

export const wsConnectionStatusStore = writable<'connected' | 'disconnected'>('connected')

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
