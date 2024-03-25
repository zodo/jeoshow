<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	export let userId: string
	export let round: Extract<GameEvents.StageSnapshot, { type: 'round' }>

	const isActiveUser = userId === round.activePlayerId

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		dispatch('action', { type: 'question-select', questionId })
	}
</script>

<section transition:scale={{ duration: 300, easing: quintInOut }}>
	<div>
		<table class:active-user={isActiveUser}>
			<caption>{round.name}</caption>
			<tbody>
				{#each round.themes as { name, questions }}
					<tr>
						<th>{name}</th>
						{#each questions as { id, price, available }}
							<td
								class:available={available && isActiveUser}
								class:unavailable={!available}
								on:click={() => selectQuestion(id)}
							>
								{price}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	{#if round.timeoutSeconds && false}
		<Progress seconds={round.timeoutSeconds} />
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		user-select: none;
	}

	div {
		overflow-x: auto;
		width: 100%;
		padding: 1rem;
	}

	table {
		border-collapse: collapse;
		width: 100%;
		margin: 0 auto;
		max-width: 40rem;
		table-layout: fixed;
	}

	table caption {
		font-size: 1.5em;
		margin: 0.5em 0 0.75em;
	}

	tr:not(:last-child) {
		border-bottom: 2px solid var(--color-neutral);
	}

	.active-user tr:not(:last-child) {
		border-bottom: 2px solid var(--color-accent);
	}

	td {
		padding: 0.5rem 0.1em;
		text-align: center;
		transition: background-color 0.3s;
	}

	.unavailable {
		color: var(--color-neutral);
	}

	td.available {
		cursor: pointer;
	}

	td.available:hover {
		background-color: var(--color-accent);
	}

	td.highlight {
		color: var(--color-accent);
	}

	th:first-child {
		width: 10rem;
		font-weight: normal;
		text-align: left;
	}
</style>
