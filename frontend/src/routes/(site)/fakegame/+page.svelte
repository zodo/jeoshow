<script lang="ts">
	import Game from '$lib/components/Game.svelte'
	import { readable } from 'svelte/store'

	const changingBoolean = readable(true, (set, update) => {
		const interval = setInterval(() => {
			update((value) => !value)
		}, 2500)

		return () => {
			clearInterval(interval)
		}
	})

	let answer = ''
</script>

<Game
	state={{
		stage: {
			type: 'question',
			fragments: [],
			theme: 'Theme',
		},
		players: [
			{
				id: '1',
				name: 'Player 1',
				score: $changingBoolean ? 100 : 500,
				active: true,
				disconnected: false,
				pressedButton: null,
				answerAttemts: 123,
			},
		],
		disconnected: false,
		controls: {
			mode: 'hit',
			ready: false,
			falselyStart: false,
		},
		answerAttempt: $changingBoolean
			? {
					type: 'in-progress',
					playerName: 'Player',
					answer: 'My answer',
					isMe: false,
				}
			: {
					type: 'incorrect',
					playerName: 'Player',
					answer: 'My answer',
					isMe: false,
				},
		stageBlink: false,
		showPlayers: true,
	}}
	on:action={(e) => {
		if (e.detail.type === 'answer-typing') {
			answer = e.detail.value
		}
	}}
/>
