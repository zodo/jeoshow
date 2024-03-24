<script lang="ts">
	import { onMount } from 'svelte'
	import type { GameEvents } from 'shared/models/events'
	import { extendedPlayerStore, handleGameEvent, gameStageStore } from '$lib/store'
	import PlayerList from '$lib/components/PlayerList.svelte'
	import Stage from '$lib/components/Stage.svelte'
	import { WebSocketGameClient } from '$lib/ws-client'
	import type { ClientAction } from 'shared/models/commands'
	import DisconnectedOverlay from './DisconnectedOverlay.svelte'

	export let gameCode: string
	export let userId: string
	export let userName: string

	let gameClient: WebSocketGameClient
	let gameConnected = false

	onMount(() => {
		gameClient = new WebSocketGameClient(gameCode, userId)

		gameClient.onConnect(() => {
			console.log('Connected to WS')
			gameClient.sendMessage({ type: 'introduce', name: userName })
		})

		gameClient.onMessage((message: GameEvents.GameEvent) => {
			handleGameEvent(message)
		})

		gameClient.isConnected().subscribe((connected) => {
			gameConnected = connected
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

	<PlayerList players={$extendedPlayerStore} />

	<Stage stage={$gameStageStore} on:action={handleStageEvent} {userId} />

	<DisconnectedOverlay showOverlay={!gameConnected} />
</section>
