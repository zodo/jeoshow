<script lang="ts">
	import {
		activePlayerIdStore,
		hitButtonStore,
		playersStore,
		playerMessagesStore,
	} from '$lib/store'
	import Player from './Player.svelte'
</script>

<section>
	<h1>Players</h1>
	<div>
		{#each $playersStore as player}
			<Player
				{player}
				pressedButton={$hitButtonStore.find((b) => b.playerId === player.id)?.type}
				active={$activePlayerIdStore === player.id}
				answers={$playerMessagesStore
					.filter((m) => m.playerId === player.id)
					.map((m) => m.text)}
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
