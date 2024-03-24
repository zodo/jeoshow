<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'

	export let userId: string
	export let appeal: Extract<GameEvents.StageSnapshot, { type: 'appeal' }>

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
</script>

<section>
	<h1>Appeal</h1>

	<h2>Answer was</h2>
	<p>{appeal.answer}</p>

	<h2>Correct answers:</h2>
	<ul>
		{#each appeal.model.answers.correct as answer}
			<li>{answer}</li>
		{/each}
	</ul>

	<h2>Agree</h2>
	<ul>
		{#each appeal.resolutions.filter((r) => r.resolution) as { playerName }}
			<li>{playerName}</li>
		{/each}
	</ul>

	<h2>Disagree</h2>
	<ul>
		{#each appeal.resolutions.filter((r) => !r.resolution) as { playerName }}
			<li>{playerName}</li>
		{/each}
	</ul>

	{#if appeal.playerId !== userId}
		<button on:click={() => dispatch('action', { type: 'appeal-resolve', resolution: true })}
			>Agree</button
		>
		<button on:click={() => dispatch('action', { type: 'appeal-resolve', resolution: false })}
			>Disagree</button
		>
	{/if}

	{#if appeal.timeoutSeconds}
		<Progress seconds={appeal.timeoutSeconds} />
	{/if}
</section>
