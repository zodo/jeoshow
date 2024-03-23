<script lang="ts">
	import { gameStageStore } from '$lib/store'
	import BeforeStart from '$lib/components/stages/BeforeStart.svelte'
	import Round from '$lib/components/stages/Round.svelte'
	import Question from './stages/Question.svelte'
	import AfterFinish from './stages/AfterFinish.svelte'
	import Answer from './stages/Answer.svelte'

	$: stage = $gameStageStore
	export let userId: string
</script>

<section>
	<h1>Stage</h1>

	{#if stage}
		{#if stage.type === 'before-start'}
			<BeforeStart on:action />
		{:else if stage.type === 'round'}
			<Round round={stage} on:action />
		{:else if stage.type === 'question'}
			<Question question={stage} {userId} on:action />
		{:else if stage.type === 'answer'}
			<Answer answer={stage} on:action />
		{:else if stage.type === 'after-finish'}
			<AfterFinish />
		{:else}
			<p>Unknown stage</p>
			<pre>{JSON.stringify(stage, null, 2)}</pre>
		{/if}
	{/if}
</section>

<pre>{JSON.stringify(stage, null, 2)}</pre>
<p>Current userId: {userId}</p>
