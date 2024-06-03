<script lang="ts">
	import Game from '$lib/components/Game.svelte'
	import AfterFinish from '$lib/components/stages/AfterFinish.svelte'
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
			meActive: true,
			themes: [
				...Array.from({ length: 26 }).map((_, i) => ({
					name: `Theme ${i + 1}`,
					questions: [
						...Array.from({ length: 15 }).map((_, j) => ({
							id: `${i}-${j}`,
							price: 100 * (j + 1),
							available: true,
						})),
					],
				})),
			],
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
			ready: true,
			falselyStart: false,
		},
		answerAttempt: {
			isMe: false,
			playerName: 'Join',
			type: 'in-progress',
			answer: 'Answer',
			avatarUrl: '/telegram/user-photo/5000362861',
		},
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
					avatarUrl: '/telegram/user-photo/5000362861',
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
