<script lang="ts">
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import type { ExtendedPlayer } from '$lib/models'

	export let players: ExtendedPlayer[] = []
</script>

<section>
	<div in:scale={{ duration: 300, easing: quintInOut }}>
		<h1>Готово</h1>

		<table>
			{#each players as player (player.id)}
				<tr>
					<td>{player.score}</td>
					<td>{player.name}</td>
				</tr>
			{/each}
		</table>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	h1 {
		font-size: 2rem;
		text-align: center;
		margin: 0;
	}

	table {
		margin-top: 20px;
		border-collapse: collapse;
	}

	td {
		padding: 10px;
		border: 1px solid var(--color-neutral);
	}

	td:first-child {
		text-align: right;
	}
</style>
