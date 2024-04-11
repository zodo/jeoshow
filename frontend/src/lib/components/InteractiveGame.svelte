<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import { WebSocketGameClient } from '$lib/ws-client'
	import Game from './Game.svelte'
	import { GameState } from '$lib/game-state'
	import type { ClientAction, GameEvent } from 'shared/models/messages'
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { dev } from '$app/environment'

	export let gameCode: string
	export let userId: string
	export let playerName: string
	export let avatarUrl: string | undefined = undefined
	export let showPlayers = true

	$: {
		if (gameState) {
			gameState.setShowPlayers(showPlayers)
		}
	}

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let wsClient: WebSocketGameClient
	let gameState: GameState

	let viewState: ViewState.View = {
		stage: { type: 'connecting' },
		players: [],
		disconnected: false,
		controls: {
			mode: 'hit',
			ready: false,
			falselyStart: false,
		},
		stageBlink: false,
		showPlayers: true,
	}

	onMount(() => {
		wsClient = new WebSocketGameClient(gameCode, userId)
		gameState = new GameState(userId)
		gameState.viewState.subscribe((newViewState) => {
			if (dev) {
				console.log('view updated', newViewState)
			}
			viewState = newViewState
		})
		gameState.addHapticListener((type) => {
			dispatch('haptic', type)
		})

		wsClient.onConnect(() => {
			wsClient.sendMessage({ type: 'introduce', name: playerName, avatarUrl })
		})

		wsClient.onMessage((message: GameEvent) => {
			gameState.handleGameEvent(message)
		})

		wsClient.isConnected().subscribe((connected) => {
			gameState.setConnected(connected)
		})

		wsClient.currentPing.subscribe((ping) => {
			console.log('ping', ping)
			if (ping > 0) {
				wsClient.sendMessage({ type: 'ping-set', ping })
			}
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

<Game state={viewState} on:action={handleStageEvent} />
