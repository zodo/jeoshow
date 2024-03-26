<script lang="ts">
	import type { GameEvents } from 'shared/models/events'
	import PlayerList from '$lib/components/PlayerList.svelte'
	import Stage from '$lib/components/Stage.svelte'
	import DisconnectedOverlay from './DisconnectedOverlay.svelte'
	import type { ExtendedPlayer } from '$lib/models'
	import Controls from './Controls.svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	export let userId: string
	export let players: ExtendedPlayer[] = []
	export let stage: GameEvents.StageSnapshot
	export let disconnected = false
</script>

<section in:scale={{ duration: 700, easing: quintInOut }} style="--player-count: {players.length}">
	<div class="players">
		<PlayerList {players} />
	</div>
	<div class="stage">
		<Stage {stage} {userId} {players} on:action />
	</div>
	<div class="controls">
		<Controls {stage} {userId} on:action />
	</div>

	<DisconnectedOverlay showOverlay={disconnected} />
</section>

<style>
	section {
		max-width: 950px;
		margin: 0 auto;

		display: grid;
		grid-template-rows: calc(var(--player-count) * 1rem + 6rem) auto 4rem;
		grid-template-columns: 1fr;
		grid-template-areas:
			'players'
			'stage'
			'controls';
		height: 100dvh;
		max-height: 1000px;
		user-select: none;
	}

	@media (min-width: 900px) {
		section {
			grid-template-rows: 1fr 100px;
			grid-template-columns: 300px 1fr;
			grid-template-areas:
				'players stage'
				'none controls';
			max-height: 850px;
		}
	}

	.players {
		grid-area: players;
		position: relative;
		overflow: hidden;
	}

	.players::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 20px;
		background: linear-gradient(rgba(0, 0, 0, 0), var(--color-background));
		pointer-events: none;
	}

	.stage {
		grid-area: stage;
		margin: 1rem;
		overflow: scroll;
		background-color: var(--color-background-darker);
		border-radius: 1.5rem;
	}

	.controls {
		margin: 0 1rem;
		grid-area: controls;
	}
</style>
