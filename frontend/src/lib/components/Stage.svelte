<script lang="ts">
	import BeforeStart from './stages/BeforeStart.svelte'
	import Round from './stages/Round.svelte'
	import Question from './stages/Question.svelte'
	import AfterFinish from './stages/AfterFinish.svelte'
	import Answer from './stages/Answer.svelte'
	import Appeal from './stages/Appeal.svelte'
	import AppealResult from './stages/AppealResult.svelte'
	import type { ViewState } from '$lib/models'

	export let state: ViewState.View

	$: stage = state.stage
</script>

<section class="h-full w-full p-2">
	{#if stage.type === 'before-start'}
		<BeforeStart on:action />
	{:else if stage.type === 'connecting'}
		<section class="flex h-full items-center justify-center">
			<div class="animate-bounce text-xl">Connecting...</div>
		</section>
	{:else if stage.type === 'round'}
		<Round round={stage} on:action />
	{:else if stage.type === 'question'}
		<Question question={stage} on:action />
	{:else if stage.type === 'answer'}
		<Answer answer={stage} on:action />
	{:else if stage.type === 'after-finish'}
		<AfterFinish players={state.players} />
	{:else if stage.type === 'appeal'}
		<Appeal appeal={stage} on:action />
	{:else if stage.type === 'appeal-result'}
		<AppealResult resolution={stage.resolution} />
	{:else}
		<p>Unknown stage</p>
		<pre>{JSON.stringify(stage, null, 2)}</pre>
	{/if}
</section>
