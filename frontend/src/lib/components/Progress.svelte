<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { linear, quintIn, quintInOut } from 'svelte/easing'
	import { tweened } from 'svelte/motion'
	import { cn } from '$lib/style-utils'
	export let seconds: number
	export let color: 'accent' | 'font' = 'accent'

	const width = tweened(100, {
		duration: seconds * 1000,
		easing: linear,
	})

	const opacity = tweened(1, {
		duration: seconds * 1000,
		easing: quintIn,
	})

	onMount(() => {
		width.set(0)
		opacity.set(0)
	})
</script>

<div class="flex w-full justify-center" in:fade={{ duration: 1000, easing: quintInOut }}>
	<div
		class={cn(
			'h-3 w-full rounded-lg border border-b-2 border-text-normal bg-bg-accent',
			color === 'font' && 'bg-text-accent'
		)}
		style="width: {$width}%; opacity: {$opacity}"
	></div>
</div>
