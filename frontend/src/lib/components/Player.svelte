<script lang="ts">
	import type { GameEvents } from 'shared/models/events'

	export let player: GameEvents.Player
	export let pressedButton: boolean
</script>

<section class:disconnected={player.disconnected} class:pressed={pressedButton}>
	<h1 title={player.id}>{player.name}</h1>
	<p>Score: {player.score}</p>
</section>

<style>
	section {
		border: 1px solid black;
		padding: 1rem;
		margin: 1rem;
		transition: background-color 3.5s;

		width: 5rem;
	}

	section.disconnected {
		border-color: red;
	}

	section.pressed {
		background-color: lightgreen;
		transition: none;
	}
</style>
