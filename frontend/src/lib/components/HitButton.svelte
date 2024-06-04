<script lang="ts">
	import Keydown from 'svelte-keydown'
	import { cn } from '$lib/style-utils'
	import { createEventDispatcher } from 'svelte'
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	export let controls: Extract<ViewState.Controls, { mode: 'hit' }>

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let hitButton: HTMLButtonElement
	let buttonActive = false
	let alreadyHit = false

	const clickHit = (e: TouchEvent | MouseEvent | CustomEvent) => {
		const isSecondTouch = (e as TouchEvent).touches && (e as TouchEvent).touches.length > 1
		if (hitButton && !alreadyHit && !isSecondTouch) {
			hitButton.click()
			dispatch('action', { type: 'button-hit' })
			buttonActive = true
			setTimeout(() => {
				buttonActive = false
			}, 100)
			alreadyHit = true
		}
	}

	const releaseHit = () => {
		alreadyHit = false
	}

	const handleMouseDown = (e: MouseEvent) => {
		clickHit(e)
	}

	const handleTouchStart = (e: TouchEvent) => {
		clickHit(e)
	}
</script>

<Keydown pauseOnInput on:Space={clickHit} on:keyup={releaseHit} />

<div class="relative z-10 h-10 w-full">
	<button
		class="relative h-full w-full cursor-pointer rounded-lg border-2 border-text-normal bg-bg-secondary"
		on:click|preventDefault
		on:mousedown={handleMouseDown}
		on:mouseup={releaseHit}
		on:touchstart={handleTouchStart}
		on:touchend={releaseHit}
		in:scale={{ duration: 300, easing: quintInOut }}
		bind:this={hitButton}
	>
		<span
			class={cn(
				'relative -mx-0.5 flex h-full w-auto -translate-y-1 select-none items-center justify-center rounded-lg border-2 border-text-normal bg-bg-accent text-center text-sm font-bold uppercase text-text-accent transition-transform ease-in-out hover:-translate-y-1.5',
				{
					'active:-translate-y-0.5 active:transition-all active:duration-100':
						!controls.falselyStart,
					'-translate-y-1.5': controls.ready && !controls.falselyStart,
					'bg-warn': controls.falselyStart,
				}
			)}
		>
			{#if controls.falselyStart}
				фальстарт
			{:else}
				жми!
			{/if}
		</span>
	</button>
</div>
