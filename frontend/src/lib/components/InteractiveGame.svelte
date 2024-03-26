<script lang="ts">
	import { onMount } from 'svelte'
	import { WebSocketGameClient } from '$lib/ws-client'
	import Game from './Game.svelte'
	import { GameState } from '$lib/game-state'
	import type { ClientAction, GameEvent } from 'shared/models/messages'
	import type { StageSnapshot } from 'shared/models/models'
	import type { ExtendedPlayer } from '$lib/models'

	export let gameCode: string
	export let userId: string
	export let playerName: string

	let wsClient: WebSocketGameClient
	let gameState: GameState

	let stage: StageSnapshot | null
	let players: ExtendedPlayer[]
	let disconnected = true

	onMount(() => {
		wsClient = new WebSocketGameClient(gameCode, userId)
		gameState = new GameState()
		gameState.stage.subscribe((newStage) => {
			stage = newStage
		})
		gameState.extendedPlayers.subscribe((newPlayers) => {
			players = newPlayers
		})

		wsClient.onConnect(() => {
			console.log('Connected to WS')
			wsClient.sendMessage({ type: 'introduce', name: playerName })
		})

		wsClient.onMessage((message: GameEvent) => {
			gameState.handleGameEvent(message)
		})

		wsClient.isConnected().subscribe((connected) => {
			disconnected = !connected
		})

		return () => {
			wsClient.close()
		}
	})

	const handleStageEvent = (event: CustomEvent<ClientAction>) => {
		wsClient.sendMessage(event.detail)
	}
</script>

{#if stage}
	<Game {userId} {players} {stage} {disconnected} on:action={handleStageEvent} />
{:else}
	<section>
		<p>Loading...</p>
	</section>
{/if}

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		height: 100dvh;
	}
</style>
