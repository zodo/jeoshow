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

	const modifyUrl = (url: string) => {
		if (url.startsWith('http')) {
			return url
		}
		return `/resources/${url}`
	}
</script>

<div class="fragments">
	{#each fragments as fragmentGroup}
		<div class="fragment-container">
			{#each fragmentGroup as fragment}
				{#if fragment.type === 'text'}
					<p class="text">{fragment.value}</p>
				{:else if fragment.type === 'image'}
					<img src={modifyUrl(fragment.url)} class="image" alt="Fragment" />
				{:else if fragment.type === 'audio'}
					<audio
						src={modifyUrl(fragment.url)}
						class="audio"
						on:play={onMediaStarted(fragment)}
						on:ended={onMediaEnded(fragment)}
						autoplay
					/>
					<p class="text">MUSIC MUISC</p>
				{:else if fragment.type === 'video'}
					<video
						src={modifyUrl(fragment.url)}
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
	video {
		max-width: 100%;
		height: auto;
	}
</style>
