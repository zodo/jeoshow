<script lang="ts">
	import { onMount } from 'svelte'
	export let seconds: number // Default value of 10 seconds
	let percentage = 100 // Start with 100% width

	onMount(() => {
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

<div class="progress-container">
	<div class="progress-bar" style="width: {percentage}%"></div>
</div>

<style>
	.progress-container {
		width: 100%;
		background-color: #eee;
		border: 1px solid #ccc;
	}

	.progress-bar {
		height: 20px;
		background-color: #76b947;
		width: 100%;
		transition: width 1s linear;
	}
</style>
