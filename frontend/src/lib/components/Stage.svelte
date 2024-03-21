<script lang="ts">
	import { gameStageStore } from '$lib/store'
	import BeforeStart from '$lib/components/stages/BeforeStart.svelte'
	import Round from '$lib/components/stages/Round.svelte'
	import Question from './stages/Question.svelte'

	$: stage = $gameStageStore
</script>

<section>
	<h1>Stage</h1>

	{#if stage}
		{#if stage.type === 'BeforeStart'}
			<BeforeStart on:action />
		{:else if stage.type === 'Round'}
			<Round round={stage} on:action />
		{:else if stage.type === 'Question'}
			<Question question={stage} on:action />
		{:else}
			<p>Unknown stage</p>
			<pre>{JSON.stringify(stage, null, 2)}</pre>
		{/if}
	{/if}
</section>
