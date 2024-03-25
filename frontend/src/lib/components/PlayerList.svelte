<script lang="ts">
	import type { ExtendedPlayer } from '$lib/models'
	import { flip } from 'svelte/animate'
	import Player from './Player.svelte'

	export let players: ExtendedPlayer[] = []
</script>

<section>
	<div class="players">
		{#each players as player (player.id)}
			<div class="player" class:active={player.active} animate:flip={{ duration: 300 }}>
				<Player {player} />
			</div>
		{/each}
	</div>
</section>

<style>
	.players {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		position: relative;
		z-index: 0;
		padding: 1rem;
		max-width: 400px;
		user-select: none;
		height: 180px;
		overflow-x: auto;
	}

	section {
		position: relative;
	}

	section::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 50px;
		background: linear-gradient(rgba(0, 0, 0, 0), var(--color-background));
		pointer-events: none;
	}

	.player {
		flex: 1 1 auto;
	}

	.active {
		flex: 1 1 100%;
	}
</style>
