<script lang="ts">
	import type { ExtendedPlayer } from '$lib/models'
	import { flip } from 'svelte/animate'
	import Player from './Player.svelte'

	export let players: ExtendedPlayer[] = []
</script>

<section>
	{#each players as player (player.id)}
		<div class="player" class:active={player.active} animate:flip={{ duration: 300 }}>
			<Player {player} />
		</div>
	{/each}
</section>

<style>
	section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		align-content: flex-start;
		gap: 0.5rem;
		position: relative;
		z-index: 0;
		user-select: none;
		overflow-x: auto;
		height: 100%;
	}

	@media (min-width: 600px) {
		section {
			align-content: center;
		}
	}

	.player {
		flex: 1 1 auto;
	}

	.active {
		flex: 1 1 100%;
	}
</style>
