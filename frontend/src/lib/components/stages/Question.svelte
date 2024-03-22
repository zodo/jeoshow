<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import type { PackModel } from 'shared/models/siq'
	import { createEventDispatcher } from 'svelte'

	export let question: Extract<GameEvents.StageSnapshot, { type: 'Question' }>

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	const modifyUrl = (url: string) => {
		if (url.startsWith('http')) {
			return url
		}
		return `/resources/${url}`
	}
</script>

<div class="question-container" class:ready-for-hit={question.substate.type === 'ReadyForHit'}>
	<div class="theme">Theme: {question.theme}</div>
	{#each question.fragments as fragmentGroup}
		<div>
			{#each fragmentGroup as fragment}
				<div class="fragment">
					{#if fragment.type === 'Text'}
						<div class="text-fragment">{fragment.value}</div>
					{:else if fragment.type === 'Image'}
						<div class="image-fragment">
							<img src={modifyUrl(fragment.url)} alt="fragment" />
						</div>
					{:else if fragment.type === 'Audio'}
						<div class="audio-fragment">
							<audio controls src={modifyUrl(fragment.url)}
								>Your browser does not support the audio element.</audio
							>
						</div>
					{:else if fragment.type === 'Video'}
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
	.price {
		color: #666;
		font-style: italic;
	}
</style>
