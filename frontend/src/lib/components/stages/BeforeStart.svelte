<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import { createEventDispatcher } from 'svelte'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
</script>

<section>
	<h1>Game will start soon</h1>

	<button on:click={() => dispatch('action', { type: 'game-start' })}>Start</button>
</section>
