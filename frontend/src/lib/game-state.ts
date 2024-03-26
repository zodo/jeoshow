import type { GameEvent } from 'shared/models/messages'
import type { Player, StageSnapshot } from 'shared/models/models'
import { derived, writable } from 'svelte/store'
import type { PlayerButtonHit, PlayerMessage } from './models'

export class GameState {
	players = writable<Player[]>([])
	stage = writable<StageSnapshot | null>(null)
	hitButton = writable<PlayerButtonHit[]>([])
	playerMessages = writable<PlayerMessage[]>([])
	activePlayerId = derived(this.stage, ($stage) => {
		if ($stage?.type === 'round') {
			return $stage.activePlayerId
		} else if ($stage?.type === 'question' && $stage.substate.type === 'awaiting-answer') {
			return $stage.substate.activePlayerId
		} else if ($stage?.type === 'appeal') {
			return $stage.playerId
		}
		return null
	})
	extendedPlayers = derived(
		[this.players, this.activePlayerId, this.hitButton, this.playerMessages],
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

	handleGameEvent = (event: GameEvent) => {
		switch (event.type) {
			case 'players-updated':
				this.players.set(event.players)
				break
			case 'stage-updated':
				this.stage.set(event.stage)
				break
			case 'player-hit-the-button':
			case 'player-false-start': {
				const type = event.type === 'player-hit-the-button' ? 'hit' : 'false-start'
				this.hitButton.update((players) => [...players, { playerId: event.playerId, type }])
				setTimeout(() => {
					this.hitButton.update((players) =>
						players.filter((p) => p.playerId !== event.playerId)
					)
				}, 100)
				break
			}
			case 'player-texted':
				this.playerMessages.update((messages) => [
					...messages,
					{ playerId: event.playerId, text: event.text },
				])
				setTimeout(() => {
					this.playerMessages.update((messages) =>
						messages.filter(
							(m) => !(m.playerId === event.playerId && m.text === event.text)
						)
					)
				}, 3500)
				break
		}
	}
}
