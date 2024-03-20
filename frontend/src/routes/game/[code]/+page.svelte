<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { PUBLIC_ENGINE_URL } from '$env/static/public'
	import type { GameEvent } from 'shared/models/events'
	import type { ClientAction } from 'shared/models/commands'

	const gameCode = $page.data.gameCode
	const userId = $page.data.userId

	let ws: WebSocket

	let eventLog: any[] = []

	const sendAction = (action: ClientAction) => {
		ws.send(JSON.stringify(action))
		eventLog = [{ type: 'out', data: action }, ...eventLog]
	}

	onMount(() => {
		ws = new WebSocket(`ws://${PUBLIC_ENGINE_URL}/ws?gameCode=${gameCode}&userId=${userId}`)
		ws.onmessage = (event) => {
			if (event.data !== 'pong') {
				console.log('Received message:', event.data)
				const gameEvent = JSON.parse(event.data) as GameEvent
				eventLog = [{ type: 'in', data: gameEvent }, ...eventLog]
			}
		}

		ws.onopen = () => {
			sendAction({
				type: 'Introduce',
				name: 'Test name',
			})
		}

		const pinger = setInterval(() => {
			ws.send('ping')
		}, 5000)

		return () => {
			clearInterval(pinger)
			ws.close()
		}
	})
</script>

<section>
	<h1>Game {gameCode}</h1>
	<p>Game page</p>

	<button on:click={() => sendAction({ type: 'HitButton' })}>Hit</button>
	<button on:click={() => sendAction({ type: 'StartGame' })}>Start</button>

	<ul>
		{#each eventLog as event}
			<li>
				{event.type === 'in' ? 'Received' : 'Sent'}:
				<pre>{JSON.stringify(event.data, null, 2)}</pre>
			</li>
		{/each}
	</ul>
</section>
