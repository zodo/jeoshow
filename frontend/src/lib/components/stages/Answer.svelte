<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'

	export let answer: Extract<GameEvents.StageSnapshot, { type: 'answer' }>

	const modifyUrl = (url: string) => {
		if (url.startsWith('http')) {
			return url
		}
		return `/resources/${url}`
	}
</script>

<div class="answer-container">
	<div class="theme">Theme: {answer.theme}</div>
	{#each answer.model.content as fragmentGroup}
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

<style>
	.answer-container {
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
</style>
