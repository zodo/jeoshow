<script lang="ts">
	import BeforeStart from './stages/BeforeStart.svelte'
	import Round from './stages/Round.svelte'
	import Question from './stages/Question.svelte'
	import AfterFinish from './stages/AfterFinish.svelte'
	import Answer from './stages/Answer.svelte'
	import Appeal from './stages/Appeal.svelte'
	import AppealResult from './stages/AppealResult.svelte'
	import type { GameEvents } from 'shared/models/events'

	export let stage: GameEvents.StageSnapshot | null
	export let userId: string
</script>

<section>
	<h1>Stage</h1>

	{#if stage}
		{#if stage.type === 'before-start'}
			<BeforeStart on:action />
		{:else if stage.type === 'round'}
			<Round round={stage} {userId} on:action />
		{:else if stage.type === 'question'}
			<Question question={stage} {userId} on:action />
		{:else if stage.type === 'answer'}
			<Answer answer={stage} on:action />
		{:else if stage.type === 'after-finish'}
			<AfterFinish />
		{:else if stage.type === 'appeal'}
			<Appeal appeal={stage} {userId} on:action />
		{:else if stage.type === 'appeal-result'}
			<AppealResult resolution={stage.resolution} />
		{:else}
			<p>Unknown stage</p>
			<pre>{JSON.stringify(stage, null, 2)}</pre>
		{/if}
	{/if}
</section>

<pre>{JSON.stringify(stage, null, 2)}</pre>
<p>Current userId: {userId}</p>
