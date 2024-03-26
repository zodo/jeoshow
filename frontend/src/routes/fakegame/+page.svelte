<script lang="ts">
	import Game from '$lib/components/Game.svelte'
	import type { ExtendedPlayer } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { readable } from 'svelte/store'

	const randomBoolean = readable(true, (set) => {
		const interval = setInterval(() => {
			set(Math.random() > 0.5)
		}, 2000)

		return () => clearInterval(interval)
	})

	let currentStage = 0
	let stages: GameEvents.StageSnapshot[] = [
		{
			type: 'before-start',
		},
	]

	let players: ExtendedPlayer[] = []
	let stage: GameEvents.StageSnapshot = stages[0]

	$: {
		let tmpPlayers: ExtendedPlayer[] = [
			{
				id: 'userId',
				name: 'Player 1 long name very',
				score: 0,
				disconnected: false,
				pressedButton: $randomBoolean ? 'hit' : null,
				active: false,
				messages: [],
			},
			{
				id: '2',
				name: 'Player 2',
				score: $randomBoolean ? 100 : 700,
				disconnected: false,
				pressedButton: null,
				active: $randomBoolean,
				messages: [],
			},
			{
				id: '3',
				name: 'Player 3',
				score: 100500,
				disconnected: true,
				pressedButton: null,
				active: false,
				messages: $randomBoolean ? [] : ['Another'],
			},
		]

		tmpPlayers = [
			...tmpPlayers,
			...tmpPlayers.map((p) => ({
				...p,
				id: p.id + 'a',
				active: false,
				pressedButton: null,
				disconnected: false,
			})),
			...tmpPlayers.map((p) => ({
				...p,
				id: p.id + 'b',
				active: false,
				pressedButton: null,
				disconnected: false,
			})),
		]

		tmpPlayers.sort((a, b) => {
			if (a.active && !b.active) return -1
			if (!a.active && b.active) return 1
			return b.score - a.score
		})

		players = tmpPlayers

		stages = [
			{
				type: 'before-start',
			},
			{
				type: 'round',
				name: '1-й раунд',
				themes: [
					{
						name: 'С Новым годом!',
						questions: [
							{ id: 'e28971f8-0', price: 100, available: true },
							{ id: 'e28971f8-1', price: 200, available: true },
							{ id: 'e28971f8-2', price: 300, available: true },
							{ id: 'e28971f8-3', price: 400, available: true },
							{ id: 'e28971f8-4', price: 500, available: true },
						],
					},
					{
						name: 'Мешапы',
						questions: [
							{ id: '2db8d6c0-0', price: 100, available: true },
							{ id: '2db8d6c0-1', price: 200, available: false },
							{ id: '2db8d6c0-2', price: 300, available: true },
							{ id: '2db8d6c0-3', price: 400, available: true },
							{ id: '2db8d6c0-4', price: 500, available: true },
						],
					},
					{
						name: 'Компуктерные игры',
						questions: [
							{ id: 'dd8de52f-0', price: 100, available: true },
							{ id: 'dd8de52f-1', price: 200, available: true },
							{ id: 'dd8de52f-2', price: 300, available: true },
							{ id: 'dd8de52f-3', price: 400, available: false },
							{ id: 'dd8de52f-4', price: 500, available: false },
						],
					},
					{
						name: 'Мемные видосики',
						questions: [
							{ id: 'f7e29128-0', price: 100, available: true },
							{ id: 'f7e29128-1', price: 200, available: true },
							{ id: 'f7e29128-2', price: 300, available: true },
							{ id: 'f7e29128-3', price: 400, available: true },
							{ id: 'f7e29128-4', price: 500, available: true },
						],
					},
					{
						name: 'Мам кути мутики',
						questions: [
							{ id: 'a1a3f5d1-0', price: 100, available: true },
							{ id: 'a1a3f5d1-1', price: 200, available: true },
							{ id: 'a1a3f5d1-2', price: 300, available: true },
							{ id: 'a1a3f5d1-3', price: 400, available: true },
							{ id: 'a1a3f5d1-4', price: 500, available: true },
						],
					},
					{
						name: 'Косплей',
						questions: [
							{ id: '87500c08-0', price: 100, available: true },
							{ id: '87500c08-1', price: 200, available: true },
							{ id: '87500c08-2', price: 300, available: true },
							{ id: '87500c08-3', price: 400, available: true },
							{ id: '87500c08-4', price: 500, available: true },
						],
					},
					{
						name: 'Аниме',
						questions: [
							{ id: 'c30a94d9-0', price: 100, available: true },
							{ id: 'c30a94d9-1', price: 200, available: true },
							{ id: 'c30a94d9-2', price: 300, available: true },
							{ id: 'c30a94d9-3', price: 400, available: true },
							{ id: 'c30a94d9-4', price: 500, available: true },
						],
					},
					{
						name: 'Напас лавандос',
						questions: [
							{ id: '658d0f99-0', price: 100, available: true },
							{ id: '658d0f99-1', price: 200, available: true },
							{ id: '658d0f99-2', price: 300, available: true },
							{ id: '658d0f99-3', price: 400, available: true },
							{ id: '658d0f99-4', price: 500, available: true },
						],
					},
				],
				activePlayerId: 'userId',
				timeoutSeconds: 60,
				playerIdsCanAppeal: $randomBoolean ? ['userId'] : ['another'],
			},
			{
				type: 'question',
				fragments: [
					[
						{ type: 'text', value: 'назовите игру  из игротеки по картинке' },
						{
							type: 'image',
							url: 'packs/20a7156dbaa92f87d88e94ad2345330297257502/slf3lg.jpg',
						},
					],
				],
				price: 100,
				theme: 'Игротека',
				themeComment: 'Выбери итд',
				substate: { type: 'idle' },
			},
			{
				type: 'question',
				fragments: [
					[{ type: 'text', value: 'Пошёл нахуй' }],
					[
						{
							type: 'video',
							url: 'packs/51e8d9882b7ef55307fd49318a2f4b88fb296541/glmpcd.mp4',
						},
					],
				],
				price: 100,
				theme: 'Игротека',
				themeComment: 'Выбери итд',
				substate: { type: 'ready-for-hit', timeoutSeconds: 8 },
			},
			{
				type: 'question',
				fragments: [
					[
						{ type: 'text', value: 'назовите игру  из игротеки по картинке' },
						{
							type: 'image',
							url: 'packs/20a7156dbaa92f87d88e94ad2345330297257502/slf3lg.jpg',
						},
					],
				],
				price: 100,
				theme: 'Игротека',
				themeComment: 'Выбери итд',
				substate: { type: 'awaiting-answer', activePlayerId: 'userId', timeoutSeconds: 12 },
			},
			{
				type: 'question',
				fragments: [
					[
						{
							type: 'image',
							url: 'packs/d801081f33199d5ba893ccbd5df18f0d99681200/jyq5r.jpg',
						},
						{
							type: 'text',
							value: 'Часовая башня В ЭТОМ ПРИМОРСКОМ ГОРОДЕ Грузии – реплика башни в турецком Измире',
						},
					],
				],
				price: 300,
				theme: 'Башни на фото',
				themeComment: '',
				substate: { type: 'ready-for-hit', timeoutSeconds: 8 },
			},
			{
				type: 'answer',
				theme: 'Совместный режим',
				model: {
					correct: ['18'],
					content: [
						[{ type: 'text', value: '18' }],
						[
							{
								type: 'audio',
								url: 'packs/20a7156dbaa92f87d88e94ad2345330297257502/xhpckn.jpg',
							},
						],
					],
				},
			},
			{
				type: 'appeal',
				model: {
					id: '1',
					fragments: [],
					answers: {
						correct: ['18'],
						incorrect: [],
						content: [],
					},
					price: 100,
				},
				answer: '19',
				playerId: 'userId',
				resolutions: [
					{ playerId: '2', resolution: true },
					{ playerId: '3', resolution: false },
					{ playerId: 'userId', resolution: true },
				],
				timeoutSeconds: 10,
			},
			{
				type: 'appeal-result',
				resolution: true,
			},
			{
				type: 'after-finish',
			},
		]

		stage = stages[currentStage]
	}
</script>

<Game
	userId={'userId'}
	{stage}
	{players}
	on:action={(e) => {
		currentStage++
		if (currentStage >= stages.length) currentStage = 0
		stage = stages[currentStage]
	}}
/>
