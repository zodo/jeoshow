<script lang="ts">
	import BeforeStart from './stages/BeforeStart.svelte'
	import Round from './stages/Round.svelte'
	import Question from './stages/Question.svelte'
	import AfterFinish from './stages/AfterFinish.svelte'
	import Answer from './stages/Answer.svelte'
	import Appeal from './stages/Appeal.svelte'
	import AppealResult from './stages/AppealResult.svelte'
	import type { GameEvents } from 'shared/models/events'
	import type { ExtendedPlayer } from '$lib/models'

	export let players: ExtendedPlayer[] = []
	export let stage: GameEvents.StageSnapshot
	export let userId: string
</script>

<section>
	{#if stage.type === 'before-start'}
		<BeforeStart on:action />
	{:else if stage.type === 'round'}
		<Round round={stage} {userId} on:action />
	{:else if stage.type === 'question'}
		<Question question={stage} on:action />
	{:else if stage.type === 'answer'}
		<Answer answer={stage} on:action />
	{:else if stage.type === 'after-finish'}
		<AfterFinish {players} />
	{:else if stage.type === 'appeal'}
		<Appeal appeal={stage} {userId} {players} on:action />
	{:else if stage.type === 'appeal-result'}
		<AppealResult resolution={stage.resolution} />
	{:else}
		<p>Unknown stage</p>
		<pre>{JSON.stringify(stage, null, 2)}</pre>
	{/if}
</section>

<style>
	section {
		background-color: var(--color-background-darker);
		width: 100%;
		height: 100%;
		border-radius: 1.5rem;
	}
</style>
