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
			awaitingAnswer: $changingBoolean
				? {
						type: 'in-progress',
						isMe: false,
						playerName: 'Player',
						answer: 'My answer',
						timeoutSeconds: 60,
					}
				: {
						type: 'incorrect',
						isMe: false,
						playerName: 'Player',
						answer: 'My answer',
						timeoutSeconds: 60,
					},
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
		stageBlink: false,
		showPlayers: true,
	}}
	on:action={(e) => {
		if (e.detail.type === 'answer-typing') {
			answer = e.detail.value
		}
	}}
/>
