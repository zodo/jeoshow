<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import { cn } from '$lib/style-utils'
	import { createEventDispatcher, onMount } from 'svelte'

	export let fragmentHeight: string
	export let url: string

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let autoplayPrevented = false
	let videoElement: HTMLVideoElement

	$: {
		if (url && videoElement) {
			videoElement
				.play()
				.then(() => {
					console.log('autoplayed video')
				})
				.catch((e) => {
					console.log('autoplay prevented', e)
					autoplayPrevented = true
				})
		}
	}

	const manualPlay = () => {
		console.log('play video manually')
		videoElement.play()
		autoplayPrevented = false
	}
</script>

<div
	class={cn(
		'relative w-11/12 text-center',
		fragmentHeight === 'full' && 'max-h-full',
		fragmentHeight === '1/2' && 'max-h-[65%]',
		fragmentHeight === '1/3' && 'max-h-[45%]'
	)}
>
	{#if autoplayPrevented}
		<button class="absolute inset-0 z-10 backdrop-blur-3xl" on:click={manualPlay}>
			<svg
				class="m-auto h-24 w-24 text-bg-accent"
				aria-hidden="true"
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				fill="none"
				viewBox="0 0 24 24"
			>
				<path
					stroke="currentColor"
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M8 18V6l8 6-8 6Z"
				/>
			</svg>
		</button>
	{/if}
	<video
		src={url}
		on:play={() => dispatch('media', 'started')}
		on:ended={() => dispatch('media', 'stopped')}
		on:canplay={() => (videoElement.volume = 0.5)}
		bind:this={videoElement}
		playsinline
		disableRemotePlayback
		class="h-full w-full object-contain drop-shadow-md"
	>
		<track kind="captions" />
	</video>
</div>
