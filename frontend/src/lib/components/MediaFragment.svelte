<script lang="ts">
	import type { PackModel } from 'shared/models/siq'
	import { createEventDispatcher } from 'svelte'
	import type { SvelteCustomEvent } from '$lib/models'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'
	import { dev } from '$app/environment'
	import { fit, parent_style } from '$lib/resizable-text'
	import MediaVideo from './MediaVideo.svelte'
	import MediaAudio from './MediaAudio.svelte'

	export let fragments: PackModel.FragmentGroup[]

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	let mediaInProgress = 0

	const onMedia = (value: 'started' | 'stopped') => {
		if (value === 'started') {
			mediaInProgress++
		} else if (value === 'stopped') {
			mediaInProgress--
			if (mediaInProgress === 0) {
				dispatch('action', { type: 'media-finished' })
			}
		}
	}

	const modifyUrl = (url: string) => {
		if (url.startsWith('http')) {
			return url
		}
		if (dev) {
			return `/resources/packs/${url}`
		}
		const encodedPath = encodeURIComponent(`packs/${url}`)
		return `https://content.jeoshow.220400.xyz/${encodedPath}`
	}

	$: fragmentsCount = fragments.flat().length
	$: fragmentHeight = fragmentsCount == 1 ? 'full' : fragmentsCount == 2 ? '1/2' : '1/3'
</script>

<div
	class="flex h-full w-full flex-col items-center gap-4 justify-center-safe"
	in:scale={{ duration: 1000, easing: quintInOut }}
>
	{#each fragments as fragmentGroup}
		{#each fragmentGroup as fragment}
			{#if fragment.type === 'text'}
				<div
					class={cn(
						'w-full text-center',
						fragmentHeight === 'full' && 'max-h-full',
						fragmentHeight === '1/2' && 'max-h-[30%]',
						fragmentHeight === '1/3' && 'max-h-[20%]'
					)}
				>
					<div style={parent_style}>
						<span use:fit={{ max_size: 30 }} class="font-serif">{fragment.value}</span>
					</div>
				</div>
			{:else if fragment.type === 'image'}
				<div
					class={cn(
						'w-full',
						fragmentHeight === 'full' && 'max-h-full',
						fragmentHeight === '1/2' && 'max-h-[65%]',
						fragmentHeight === '1/3' && 'max-h-[45%]'
					)}
				>
					<img
						class="h-full w-full object-contain drop-shadow-md"
						src={modifyUrl(fragment.url)}
						alt="Fragment"
					/>
				</div>
			{:else if fragment.type === 'audio'}
				<MediaAudio url={modifyUrl(fragment.url)} on:media={(e) => onMedia(e.detail)} />
			{:else if fragment.type === 'video'}
				<MediaVideo
					{fragmentHeight}
					url={modifyUrl(fragment.url)}
					on:media={(e) => onMedia(e.detail)}
				/>
			{/if}
		{/each}
	{/each}
</div>
