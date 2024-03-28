<script lang="ts">
	import { onMount } from 'svelte'
	import { fade } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	export let seconds: number
	let percentage = 100

	onMount(() => {
		setTimeout(() => {
			percentage -= 100 / seconds
		}, 100)

		const interval = setInterval(() => {
			percentage -= 100 / seconds
			if (percentage <= 0) {
				percentage = 0
				clearInterval(interval)
			}
		}, 1000)

		return () => {
			clearInterval(interval) // Cleanup on component destroy
		}
	})
</script>

<div class="progress-container" in:fade={{ duration: 1000, easing: quintInOut }}>
	<div
		class="progress-bar medium-shadow"
		style="width: {percentage}%; opacity: {percentage / 100}"
	></div>
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
