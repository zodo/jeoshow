<script lang="ts">
	import Game from '$lib/components/Game.svelte'
</script>

<Game
	state={{
		stage: {
			type: 'question',
			fragments: [],
			theme: 'Theme',
			awaitingAnswer: {
				type: 'in-progress',
				awaiting: true,
				isMe: false,
				playerName: 'Player',
				answer: 'Typing smt',
				timeoutSeconds: 60,
			},
		},
		players: [],
		disconnected: false,
		controls: {
			mode: 'hit',
			ready: true,
			falselyStart: true,
		},
		stageBlink: false,
		showPlayers: true,
	}}
	on:action={(e) => {
		console.log(e)
	}}
/>
