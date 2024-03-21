<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import type { PackModel } from 'shared/models/siq'
	import { createEventDispatcher } from 'svelte'

	export let question: Extract<GameEvents.StageSnapshot, { type: 'Question' }>

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
</script>

<div class="question-container">
	<div class="theme">Theme: {question.theme}</div>
	<div class="price">Price: ${question.price}</div>
	{#each question.fragments as fragment}
		<div class="fragment">
			{#if fragment.type === 'Text'}
				<div class="text-fragment">{fragment.value}</div>
			{:else if fragment.type === 'Image'}
				<div class="image-fragment">
					<img src={fragment.url} alt="fragment" />
				</div>
			{:else if fragment.type === 'Audio'}
				<div class="audio-fragment">
					<audio controls src={fragment.url}
						>Your browser does not support the audio element.</audio
					>
				</div>
			{:else if fragment.type === 'Video'}
				<div class="video-fragment">
					<video controls src={fragment.url}>
						<track kind="captions" />
						Your browser does not support the video tag.
					</video>
				</div>
			{/if}
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
