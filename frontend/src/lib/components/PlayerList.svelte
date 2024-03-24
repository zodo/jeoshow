<script lang="ts">
	import type { ExtendedPlayer } from '$lib/models'
	import { flip } from 'svelte/animate'
	import Player from './Player.svelte'

	export let players: ExtendedPlayer[] = []
</script>

<section>
	{#each players as player (player.id)}
		<div class:full-width={player.active} animate:flip={{ duration: 300 }}>
			<Player {player} />
		</div>
	{/each}
</section>

<style>
	section {
		display: flex;
		flex-wrap: wrap;
		justify-content: center;
		align-items: first baseline;
		gap: 0.5rem;
		position: relative;
		z-index: 0;
		padding: 1rem;
		max-width: 400px;
		user-select: none;
	}

	.full-width {
		width: 100%;
	}
</style>
