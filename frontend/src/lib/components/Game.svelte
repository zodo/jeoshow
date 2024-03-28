<script lang="ts">
	import type { StageSnapshot } from 'shared/models/models'
	import PlayerList from '$lib/components/PlayerList.svelte'
	import Stage from '$lib/components/Stage.svelte'
	import DisconnectedOverlay from './DisconnectedOverlay.svelte'
	import type { ExtendedPlayer } from '$lib/models'
	import Controls from './Controls.svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	export let userId: string
	export let players: ExtendedPlayer[] = []
	export let stage: StageSnapshot
	export let disconnected = false
	export let blinkStage = false
</script>

<section in:scale={{ duration: 700, easing: quintInOut }}>
	<div class="players">
		<PlayerList {players} />
	</div>
	<div class="stage" class:blink={blinkStage}>
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
		max-height: 850px;
		display: grid;
		grid-template-rows: fit-content(30%) 1fr 3rem;
		grid-template-columns: 1fr;
		grid-template-areas:
			'players'
			'stage'
			'controls';
		user-select: none;
		gap: 1rem;
	}

	@media (orientation: landscape) {
		section {
			grid-template-rows: 1fr 3rem;
			grid-template-columns: 250px 1fr;
			grid-template-areas:
				'players stage'
				'. controls';
		}
	}

	.players {
		grid-area: players;
		position: relative;
		overflow: scroll;
	}

	.stage {
		grid-area: stage;
		overflow: scroll;
		background-color: var(--color-background-darker);
		border-radius: 1.5rem;
		transition: background-color 0.8s;
	}

	.blink {
		background-color: var(--color-accent);
		transition: none;
	}

	.controls {
		grid-area: controls;
	}
</style>
