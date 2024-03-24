<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'

	export let question: Extract<GameEvents.StageSnapshot, { type: 'question' }>
	export let userId: string

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let answer: string
</script>

<div class="question-container" class:ready-for-hit={question.substate.type === 'ready-for-hit'}>
	<div class="theme">Theme: {question.theme}</div>
	{#if question.themeComment}
		<div class="theme-comment">{question.themeComment}</div>
	{/if}
	<MediaFragment fragments={question.fragments} on:action />
</div>

{#if question.substate.type === 'ready-for-hit' && question.substate.timeoutSeconds}
	<Progress seconds={question.substate.timeoutSeconds} />
{/if}

{#if question.substate.type === 'awaiting-answer' && question.substate.activePlayerId === userId}
	{#if question.substate.timeoutSeconds}
		<Progress seconds={question.substate.timeoutSeconds} />
	{/if}
	<div class="question-container">
		<input type="text" placeholder="Your answer" bind:value={answer} />
		<button
			on:click={() => dispatch('action', { type: 'answer-give', value: answer })}
			disabled={!answer}
		>
			Give answer
		</button>
	</div>
{/if}

<style>
	.question-container {
		margin: 20px;
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}
	.ready-for-hit {
		background-color: #f0f0f0;
		border-color: #666;
	}
	.theme {
		font-weight: bold;
		margin-bottom: 10px;
	}
	.theme-comment {
		margin-top: 10px;
		font-style: italic;
	}
</style>
