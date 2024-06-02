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

<div class="relative h-10 w-full">
	<button
		class={cn(
			' relative z-10 h-full w-full cursor-pointer rounded-lg border-none bg-bg-secondary text-xl uppercase transition-colors  duration-1000 active:bg-danger active:transition-none',
			{
				'bg-bg-accent text-text-accent': controls.ready && !controls.falselyStart,
			},
			{
				'bg-warn transition-none': buttonActive && controls.falselyStart,
			},
			{
				'bg-danger transition-none': buttonActive && !controls.falselyStart,
			}
		)}
		on:click|preventDefault
		on:mousedown={handleMouseDown}
		on:mouseup={releaseHit}
		on:touchstart={handleTouchStart}
		on:touchend={releaseHit}
		in:scale={{ duration: 300, easing: quintInOut }}
		bind:this={hitButton}
	>
		Жми!
	</button>
</div>
