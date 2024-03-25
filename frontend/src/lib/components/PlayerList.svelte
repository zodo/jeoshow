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
		align-content: center;
		gap: 0.5rem;
		position: relative;
		z-index: 0;
		padding: 1rem;
		user-select: none;
		overflow-x: auto;
		height: 100%;
		margin-top: 0.5rem;
	}

	.player {
		flex: 1 1 auto;
	}

	.active {
		flex: 1 1 100%;
	}
</style>
