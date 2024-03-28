<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { StageSnapshot } from 'shared/models/models'
	import { createEventDispatcher } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	export let userId: string
	export let round: Extract<StageSnapshot, { type: 'round' }>

	const isActiveUser = userId === round.activePlayerId

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		if (isActiveUser) {
			dispatch('action', { type: 'question-select', questionId })
		}
	}
</script>

<section in:scale={{ duration: 300, easing: quintInOut }}>
	<div>
		<table>
			<caption>{round.name}</caption>
			<tbody>
				{#each round.themes as { name, questions }}
					<tr>
						<td>{name}</td>
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
	}

	table {
		border-collapse: collapse;
		width: 100%;
		margin: 0 auto;
	}

	table caption {
		font-size: 1.5em;
		margin: 0.5em 0 0.75em;
	}

	tr:not(:last-child) {
		border-bottom: 2px solid var(--color-neutral);
	}

	td {
		padding: 0.5rem 0.2em;
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

	td:first-child {
		max-width: 10rem;
		font-weight: normal;
		text-align: left;
	}
</style>
