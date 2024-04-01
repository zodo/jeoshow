<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { linear, quintIn, quintInOut, quintOut } from 'svelte/easing'
	import { tweened } from 'svelte/motion'
	export let seconds: number

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
		class="bg-bg-accent h-3 w-full rounded-3xl shadow-md"
		style="width: {$width}%; opacity: {$opacity}"
	></div>
</div>
