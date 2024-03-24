<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'
	import { activePlayerIdStore } from '$lib/store'

	export let userId: string
	export let round: Extract<GameEvents.StageSnapshot, { type: 'round' }>

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		dispatch('action', { type: 'question-select', questionId })
	}
</script>

<section>
	<h1>Round</h1>

	<h2>{round.name}</h2>

	{#if round.playerIdsCanAppeal.includes(userId)}
		<button on:click={() => dispatch('action', { type: 'appeal-start' })}> Appeal! </button>
	{/if}

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
	{#if round.timeoutSeconds}
		<Progress seconds={round.timeoutSeconds} />
	{/if}
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
