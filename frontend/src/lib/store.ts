import type { GameEvents } from 'shared/models/events'
import { derived, writable } from 'svelte/store'

export const playersStore = writable<GameEvents.Player[]>([])

export const gameStageStore = writable<GameEvents.StageSnapshot | null>(null)

export const hitButtonStore = writable<{ playerId: string; type: 'ok' | 'false' }[]>([])

export const activePlayerIdStore = derived(gameStageStore, ($gameStageStore) => {
	if ($gameStageStore?.type === 'round') {
		return $gameStageStore.activePlayerId
	} else if (
		$gameStageStore?.type === 'question' &&
		$gameStageStore.substate.type === 'awaiting-answer'
	) {
		return $gameStageStore.substate.activePlayerId
	} else if ($gameStageStore?.type === 'appeal') {
		return $gameStageStore.playerId
	}
	return null
})

export const wsConnectionStatusStore = writable<'connected' | 'disconnected'>('connected')

export const playerMessagesStore = writable<
	{
		playerId: string
		text: string
	}[]
>([])

export const handleGameEvent = (event: GameEvents.GameEvent) => {
	switch (event.type) {
		case 'players-updated':
			playersStore.set(event.players)
			break
		case 'stage-updated':
			gameStageStore.set(event.stage)
			break
		case 'player-hit-the-button':
			hitButtonStore.update((players) => [
				...players,
				{ playerId: event.playerId, type: 'ok' },
			])
			setTimeout(() => {
				hitButtonStore.update((players) =>
					players.filter((p) => p.playerId !== event.playerId)
				)
			}, 100)
			break
		case 'player-false-start':
			hitButtonStore.update((players) => [
				...players,
				{ playerId: event.playerId, type: 'false' },
			])
			setTimeout(() => {
				hitButtonStore.update((players) =>
					players.filter((p) => p.playerId !== event.playerId)
				)
			}, 100)
			break
		case 'player-texted':
			playerMessagesStore.update((messages) => [
				...messages,
				{ playerId: event.playerId, text: event.text },
			])
			setTimeout(() => {
				playerMessagesStore.update((messages) =>
					messages.filter(
						(m) => !(m.playerId === event.playerId && m.text === event.text)
					)
				)
			}, event.text.length * 700)
			break
	}
}
