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
			type: 'round',
			name: 'Round 1',
			themes: [],
			meActive: true,
			appealVoting: $changingBoolean
				? {
						correctAnswers: ['Правильно', 'Pravilno'],
						answer: 'Неправильно',
						playerName: 'Player 1',
						agree: ['asd'],
						disagree: ['asd', 'asd'],
						timeoutSeconds: 3,
						meVoted: false,
					}
				: undefined,
			appealResolution: !$changingBoolean ? 'approved' : undefined,
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
				ping: 123,
			},
		],
		disconnected: false,
		controls: {
			mode: 'hit',
			ready: false,
			falselyStart: false,
		},
		answerAttempt: undefined,
		stageBlink: false,
		showPlayers: true,
	}}
	on:action={(e) => {
		if (e.detail.type === 'answer-typing') {
			answer = e.detail.value
		}
	}}
/>
