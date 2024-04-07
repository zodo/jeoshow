<script lang="ts">
	import type { PackModel } from 'shared/models/siq'
	import { createEventDispatcher } from 'svelte'
	import type { SvelteCustomEvent } from '$lib/models'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'
	import { fit, parent_style } from '$lib/resizable-text'
	import MediaVideo from './MediaVideo.svelte'
	import MediaAudio from './MediaAudio.svelte'
	import { modifyMediaUrl } from '$lib/game-state'

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

	$: fragmentsCount = fragments.flat().length
	$: fragmentHeight = fragmentsCount == 1 ? 'full' : fragmentsCount == 2 ? '1/2' : '1/3'
</script>

<div
	in:scale|global={{ delay: 300, duration: 700, easing: quintInOut }}
	out:scale|global={{ duration: 300, easing: quintInOut }}
	class="flex h-full w-full flex-col items-center gap-4 justify-center-safe"
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
						'w-11/12',
						fragmentHeight === 'full' && 'max-h-full',
						fragmentHeight === '1/2' && 'max-h-[65%]',
						fragmentHeight === '1/3' && 'max-h-[45%]'
					)}
				>
					<img
						class="h-full w-full object-contain drop-shadow-md"
						src={modifyMediaUrl(fragment.url)}
						alt="Fragment"
					/>
				</div>
			{:else if fragment.type === 'audio'}
				<MediaAudio
					url={modifyMediaUrl(fragment.url)}
					on:media={(e) => onMedia(e.detail)}
				/>
			{:else if fragment.type === 'video'}
				<MediaVideo
					{fragmentHeight}
					url={modifyMediaUrl(fragment.url)}
					on:media={(e) => onMedia(e.detail)}
				/>
			{/if}
		{/each}
	{/each}
</div>
