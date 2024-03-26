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
		width: 100%;
		height: calc(100dvh - 2rem);
		max-width: 950px;
		display: grid;
		grid-template-rows: calc(var(--player-count) * 1rem + 4rem) 1fr 3rem;
		grid-template-columns: 1fr;
		grid-template-areas:
			'players'
			'stage'
			'controls';
		user-select: none;
		gap: 1rem;
	}

	@media (min-width: 600px) {
		section {
			grid-template-rows: 1fr 3rem;
			grid-template-columns: 250px 1fr;
			grid-template-areas:
				'players stage'
				'none controls';
			max-height: 850px;
		}
	}

	.players {
		grid-area: players;
		position: relative;
		overflow: scroll;
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
		overflow: scroll;
		background-color: var(--color-background-darker);
		border-radius: 1.5rem;
	}

	.controls {
		grid-area: controls;
	}
</style>
