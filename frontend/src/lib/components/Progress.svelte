<script lang="ts">
	import { onMount } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	export let seconds: number // Default value of 10 seconds
	let percentage = 100 // Start with 100% width

	onMount(() => {
		setTimeout(() => {
			percentage -= 100 / (seconds - 1) // Initial percentage
		}, 100)

		const interval = setInterval(() => {
			percentage -= 100 / (seconds - 1)
			if (percentage <= 0) {
				clearInterval(interval)
			}
		}, 1000)

		return () => {
			clearInterval(interval) // Cleanup on component destroy
		}
	})
</script>

<div class="progress-container" transition:scale={{ duration: 500, easing: quintInOut }}>
	<div class="progress-bar" style="width: {percentage}%; opacity: {percentage / 100}"></div>
</div>

<style>
	.progress-container {
		width: 100%;
		display: flex;
		justify-content: center;
	}

	.progress-bar {
		background-color: var(--color-accent-dark);
		width: 100%;
		height: 1rem;
		transition:
			width 1s linear,
			opacity 1s linear;
		border-radius: 1.5rem;
	}
</style>
