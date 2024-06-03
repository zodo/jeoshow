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
			theme: 'Тема вопроса',
			readyForHit: {
				timeoutSeconds: 10,
				ready: true,
			},
			showIntroduction: false,
			price: 100,
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
				// avatarUrl: 'https://jeoshow-dev.220400.xyz/telegram/user-photo/5000362861',
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
		messages: [
			...(true
				? [
						{
							player: {
								id: '2',
								name: 'Player 1',
								score: 100,
								disconnected: false,
								answerAttemts: 123,
								ping: 123,
								avatarUrl: undefined,
							},
							text: '🤔',
							id: '123',
						},
					]
				: []),
			{
				player: {
					id: '1',
					name: 'Player 1',
					score: 100,
					disconnected: false,
					answerAttemts: 123,
					ping: 123,
					avatarUrl: 'https://jeoshow-dev.220400.xyz/telegram/user-photo/5000362861',
				},
				text: 'Текст подольше',
				id: '22',
			},
		],
	}}
	on:action={(e) => {
		if (e.detail.type === 'answer-typing') {
			answer = e.detail.value
		}
	}}
/>
