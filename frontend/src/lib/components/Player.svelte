<script lang="ts">
	import type { GameEvents } from 'shared/models/events'

	export let player: GameEvents.Player
	export let pressedButton: 'ok' | 'false' | undefined
	export let active: boolean
	export let answers: string[]
</script>

<section
	class:disconnected={player.disconnected}
	class:pressed={pressedButton == 'ok'}
	class:false-start={pressedButton == 'false'}
	class:active
>
	<h4 title={player.id}>{player.name}</h4>
	<p>Score: {player.score}</p>
	<p>Answer: {answers}</p>
</section>

<style>
	section {
		border: 1px solid black;
		padding: 0 1rem;
		margin: 1rem;
		transition: background-color 1s;
		width: 7rem;
		box-sizing: border-box;
	}

	.disconnected {
		border-color: red;
	}

	.pressed {
		background-color: lightgreen;
		transition: none;
	}

	.false-start {
		background-color: lightcoral;
		transition: none;
	}

	.active {
		border: 2px solid red;
	}
</style>
