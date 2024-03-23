<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'

	export let question: Extract<GameEvents.StageSnapshot, { type: 'question' }>
	export let userId: string

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	const modifyUrl = (url: string) => {
		if (url.startsWith('http')) {
			return url
		}
		return `/resources/${url}`
	}

	let answer: string
</script>

<div class="question-container" class:ready-for-hit={question.substate.type === 'ready-for-hit'}>
	<div class="theme">Theme: {question.theme}</div>
	{#if question.themeComment}
		<div class="theme-comment">{question.themeComment}</div>
	{/if}
	{#if question.substate.type === 'ready-for-hit' && question.substate.timeoutSeconds}
		<Progress seconds={question.substate.timeoutSeconds} />
	{/if}
	{#each question.fragments as fragmentGroup}
		<div>
			{#each fragmentGroup as fragment}
				<div class="fragment">
					{#if fragment.type === 'text'}
						<div class="text-fragment">{fragment.value}</div>
					{:else if fragment.type === 'image'}
						<div class="image-fragment">
							<img src={modifyUrl(fragment.url)} alt="fragment" />
						</div>
					{:else if fragment.type === 'audio'}
						<div class="audio-fragment">
							<audio controls src={modifyUrl(fragment.url)}
								>Your browser does not support the audio element.</audio
							>
						</div>
					{:else if fragment.type === 'video'}
						<div class="video-fragment">
							<video controls src={modifyUrl(fragment.url)}>
								<track kind="captions" />
								Your browser does not support the video tag.
							</video>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}
</div>

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
	.fragment {
		margin-bottom: 10px;
	}
	.text-fragment {
		color: #333;
	}
	.image-fragment img {
		max-width: 100%;
		height: auto;
		border-radius: 4px;
	}
	.audio-fragment audio,
	.video-fragment video {
		width: 100%;
		max-width: 500px;
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
