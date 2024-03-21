<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'

	export let round: Extract<GameEvents.StageSnapshot, { type: 'Round' }>

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		dispatch('action', { type: 'SelectQuestion', questionId })
	}
</script>

<section>
	<h1>Round</h1>

	<h2>{round.name}</h2>

	<table>
		<tbody>
			{#each round.themes as { name, questions }}
				<tr>
					<td>{name}</td>
					{#each questions as { id, price, available }}
						<td
							class={available ? 'available' : 'unavailable'}
							on:click={() => selectQuestion(id)}
						>
							{price}
						</td>
					{/each}
				</tr>
			{/each}
		</tbody>
	</table>

	<p>Active player: {round.activePlayerId}</p>
</section>

<style>
	table {
		width: 100%;
		border-collapse: collapse;
	}

	td {
		border: 1px solid #ddd;
		padding: 8px;
		text-align: center;
	}

	.available {
		background-color: #90ee90; /* Light green to indicate availability */
		cursor: pointer;
	}

	.unavailable {
		background-color: #ffcccb; /* Light red to indicate unavailability */
	}
</style>
