<script lang="ts">
	import DisconnectedOverlay from '$lib/components/DisconnectedOverlay.svelte'
	import PlayerList from '$lib/components/PlayerList.svelte'
	import type { ExtendedPlayer } from '$lib/models'
	import { readable } from 'svelte/store'

	const randomBoolean = readable(true, (set) => {
		const interval = setInterval(() => {
			set(Math.random() > 0.5)
		}, 2000)

		return () => clearInterval(interval)
	})

	let players: ExtendedPlayer[] = []

	$: {
		let tmpPlayers: ExtendedPlayer[] = [
			{
				id: '1',
				name: 'Player 1 long name very',
				score: 0,
				disconnected: false,
				pressedButton: $randomBoolean ? 'hit' : null,
				active: false,
				messages: [],
			},
			{
				id: '2',
				name: 'Player 2',
				score: -50,
				disconnected: false,
				pressedButton: null,
				active: $randomBoolean,
				messages: [],
			},
			{
				id: '3',
				name: 'Player 3',
				score: 100500,
				disconnected: true,
				pressedButton: null,
				active: false,
				messages: $randomBoolean ? [] : ['Another'],
			},
		]

		tmpPlayers = [
			...tmpPlayers,
			...tmpPlayers.map((p) => ({
				...p,
				id: p.id + 'a',
				active: false,
				pressedButton: null,
				disconnected: false,
			})),
			...tmpPlayers.map((p) => ({
				...p,
				id: p.id + 'b',
				active: false,
				pressedButton: null,
				disconnected: false,
			})),
		]

		tmpPlayers.sort((a, b) => {
			if (a.active && !b.active) return -1
			if (!a.active && b.active) return 1
			return b.score - a.score
		})

		players = tmpPlayers
	}
</script>

<section>
	<!-- <button on:click={() => gameClient.sendMessage({ type: 'button-hit' })}>Hit</button>
	<button on:click={() => gameClient.sendMessage({ type: 'game-start' })}>Reset</button> -->

	<PlayerList {players} />

	<!-- <Stage stage={$gameStageStore} {userId} on:action={handleStageEvent} /> -->

	<DisconnectedOverlay showOverlay={false} />
</section>
