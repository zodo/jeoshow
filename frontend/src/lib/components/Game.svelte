<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import type { GameEvents } from 'shared/models/events'
	import { handleGameEvent } from '$lib/store'
	import PlayerList from '$lib/components/PlayerList.svelte'
	import Stage from '$lib/components/Stage.svelte'
	import { WebSocketGameClient } from '$lib/ws-client'
	import type { ClientAction } from 'shared/models/commands'

	export let gameCode: string
	export let userId: string
	export let userName: string

	let gameClient: WebSocketGameClient

	onMount(() => {
		console.log(userId)
		gameClient = new WebSocketGameClient(gameCode, userId)

		gameClient.onConnect(() => {
			console.log('Connected to WS')
			gameClient.sendMessage({ type: 'introduce', name: userName })
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

	<button on:click={() => gameClient.sendMessage({ type: 'button-hit' })}>Hit</button>
	<button on:click={() => gameClient.sendMessage({ type: 'game-start' })}>Reset</button>

	<PlayerList />

	<Stage on:action={handleStageEvent} {userId} />
</section>
