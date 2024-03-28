<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
</script>

<section>
	<button
		in:scale={{ duration: 300, easing: quintInOut }}
		class="medium-shadow"
		on:click={() => dispatch('action', { type: 'game-start' })}
	>
		Start
	</button>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
	}

	button {
		font-size: 1.5rem;
		padding: 1rem 2rem;
		border-radius: 1rem;
		background-color: var(--color-accent);
		border: none;
		cursor: pointer;
		transition: background-color 0.3s;
	}

	button:hover {
		background-color: var(--color-accent-dark);
	}
</style>
