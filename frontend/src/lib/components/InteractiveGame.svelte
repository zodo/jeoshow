<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { WebSocketGameClient } from '$lib/ws-client'
	import Game from './Game.svelte'
	import { GameState } from '$lib/game-state'
	import type { ClientAction, GameEvent } from 'shared/models/messages'
	import type { StageSnapshot } from 'shared/models/models'
	import type { ExtendedPlayer, SvelteCustomEvent } from '$lib/models'

	export let gameCode: string
	export let userId: string
	export let playerName: string
	export let avatarUrl: string | undefined = undefined
	export let showPlayers = true

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let wsClient: WebSocketGameClient
	let gameState: GameState

	let stage: StageSnapshot | null
	let players: ExtendedPlayer[]
	let disconnected = true
	let blinkStage = false

	onMount(() => {
		wsClient = new WebSocketGameClient(gameCode, userId)
		gameState = new GameState(userId)
		gameState.stage.subscribe((newStage) => {
			stage = newStage
		})
		gameState.extendedPlayers.subscribe((newPlayers) => {
			players = newPlayers
		})
		gameState.stageBlink.subscribe((blink) => {
			blinkStage = blink
			if (blink) {
				dispatch('haptic', 'medium')
			}
		})

		wsClient.onConnect(() => {
			console.log('Connected to WS', playerName, avatarUrl)
			wsClient.sendMessage({ type: 'introduce', name: playerName, avatarUrl })
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
		if (event.detail.type === 'button-hit') {
			dispatch('haptic', 'light')
		}
	}
</script>

{#if stage}
	<Game
		{userId}
		{players}
		{stage}
		{disconnected}
		{blinkStage}
		{showPlayers}
		on:action={handleStageEvent}
	/>
{:else}
	<section class="align-center flex h-[var(--height)] justify-center">
		<p>Loading...</p>
	</section>
{/if}
