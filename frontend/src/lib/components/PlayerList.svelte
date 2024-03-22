<script lang="ts">
	import { activePlayerIdStore, hitButtonStore, playersStore } from '$lib/store'
	import Player from './Player.svelte'
</script>

<section>
	<h1>Players</h1>
	<div>
		{#each $playersStore as player}
			<Player
				{player}
				pressedButton={$hitButtonStore.includes(player.id)}
				active={$activePlayerIdStore === player.id}
			/>
		{/each}
	</div>
</section>

<style>
	div {
		display: flex;
		flex-wrap: wrap;
	}
</style>
