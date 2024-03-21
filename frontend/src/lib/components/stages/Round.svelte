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

	{#each round.themes as theme}
		<h3>{theme.name}</h3>

		<ul>
			{#each theme.questions as question}
				<li>
					<button on:click={() => selectQuestion(question.id)}>
						{question.price}
					</button>
				</li>
			{/each}
		</ul>
	{/each}

	<p>Active player: {round.activePlayerId}</p>
</section>
