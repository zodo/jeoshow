<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import type { GameEvents } from 'shared/models/events'
	import { handleGameEvent } from '$lib/store'
	import PlayerList from '$lib/components/PlayerList.svelte'
	import Stage from '$lib/components/Stage.svelte'
	import { WebSocketGameClient } from '$lib/ws-client'
	import type { ClientAction } from 'shared/models/commands'

	const gameCode = $page.data.gameCode
	const userId = $page.data.userId

	let gameClient: WebSocketGameClient

	onMount(() => {
		gameClient = new WebSocketGameClient(gameCode, userId)

		gameClient.onConnect(() => {
			console.log('Connected to WS')
			gameClient.sendMessage({ type: 'Introduce', name: 'Player' })
		})

		gameClient.onMessage((message: GameEvents.GameEvent) => {
			handleGameEvent(message)
		})

		return () => {
			gameClient.close()
		}
	})

	const handleStageEvent = (event: CustomEvent<ClientAction>) => {
		gameClient.sendMessage(event.detail)
	}
</script>

<section>
	<h1>Game {gameCode}</h1>

	<button on:click={() => gameClient.sendMessage({ type: 'HitButton' })}>Hit</button>
	<button on:click={() => gameClient.sendMessage({ type: 'StartGame' })}>Reset</button>

	<PlayerList />

	<Stage on:action={handleStageEvent} />
</section>
