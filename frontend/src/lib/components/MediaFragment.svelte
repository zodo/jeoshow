<script lang="ts">
	import type { PackModel } from 'shared/models/siq'
	import { createEventDispatcher } from 'svelte'
	import type { SvelteCustomEvent } from '$lib/models'

	export let fragments: PackModel.FragmentGroup[]

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	let allMediaUrls: string[] = []

	const onMediaStarted = (fragment: PackModel.Fragment) => () => {
		if (fragment.type === 'audio' || fragment.type === 'video') {
			allMediaUrls = [...allMediaUrls, fragment.url]
		}
	}
	const onMediaEnded = (fragment: PackModel.Fragment) => () => {
		if (fragment.type === 'audio' || fragment.type === 'video') {
			allMediaUrls = allMediaUrls.filter((url) => url !== fragment.url)
			if (allMediaUrls.length === 0) {
				dispatch('action', { type: 'media-finished' })
			}
		}
	}
</script>

<div class="fragments">
	{#each fragments as fragmentGroup}
		<div class="fragment-container">
			{#each fragmentGroup as fragment}
				{#if fragment.type === 'text'}
					<p class="text">{fragment.value}</p>
				{:else if fragment.type === 'image'}
					<img src={fragment.url} class="image" alt="Fragment" />
				{:else if fragment.type === 'audio'}
					<audio
						src={fragment.url}
						class="audio"
						on:play={onMediaStarted(fragment)}
						on:ended={onMediaEnded(fragment)}
						autoplay
					></audio>
				{:else if fragment.type === 'video'}
					<video
						src={fragment.url}
						class="video"
						on:play={onMediaStarted(fragment)}
						on:ended={onMediaEnded(fragment)}
						autoplay
					>
						<track kind="captions" />
					</video>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style>
	.fragment-container {
		margin: 1rem;
	}
	p {
		font-size: 16px;
		color: #333;
	}
	img,
	audio,
	video {
		max-width: 100%;
		height: auto;
	}
</style>
