<script lang="ts">
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	export let resolution: boolean
</script>

<section in:scale={{ duration: 300, easing: quintInOut }}>
	<h1>Appeal</h1>

	{#if resolution}
		<p class="approved">Approved</p>
	{:else}
		<p>No no</p>
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	h1 {
		font-size: 2rem;
		text-align: center;
		margin: 0;
	}

	p {
		color: var(--color-danger);
		padding: 1rem;
		display: inline-block;
	}

	p.approved {
		color: var(--color-accent);
	}
</style>
