import type { GameEvents } from 'shared/models/events'
import { derived, writable } from 'svelte/store'

export const playersStore = writable<GameEvents.Player[]>([])

export const gameStageStore = writable<GameEvents.StageSnapshot | null>(null)

export const hitButtonStore = writable<{ playerId: string; type: 'hit' | 'false-start' }[]>([])

export const playerMessagesStore = writable<
	{
		playerId: string
		text: string
	}[]
>([])

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

export const extendedPlayerStore = derived(
	[playersStore, activePlayerIdStore, hitButtonStore, playerMessagesStore],
	([$players, $activePlayerId, $hitButton, $playerMessages]) => {
		return $players
			.map((player) => ({
				...player,
				pressedButton: $hitButton.find((b) => b.playerId === player.id)?.type ?? null,
				active: $activePlayerId === player.id,
				messages: $playerMessages
					.filter((m) => m.playerId === player.id)
					.map((m) => m.text),
			}))
			.sort((a, b) => {
				if (a.active && !b.active) return -1
				if (!a.active && b.active) return 1
				return b.score - a.score
			})
	}
)

export const handleGameEvent = (event: GameEvents.GameEvent) => {
	switch (event.type) {
		case 'players-updated':
			playersStore.set(event.players)
			break
		case 'stage-updated':
			gameStageStore.set(event.stage)
			break
		case 'player-hit-the-button':
		case 'player-false-start': {
			const type = event.type === 'player-hit-the-button' ? 'hit' : 'false-start'
			hitButtonStore.update((players) => [...players, { playerId: event.playerId, type }])
			setTimeout(() => {
				hitButtonStore.update((players) =>
					players.filter((p) => p.playerId !== event.playerId)
				)
			}, 100)
			break
		}
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
			}, 3500)
			break
	}
}
