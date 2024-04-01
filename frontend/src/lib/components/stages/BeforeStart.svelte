<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
</script>

<section class="flex h-full items-center justify-center">
	<button
		class="bg-bg-accent text-text-accent rounded-lg px-8 py-2 text-lg shadow-md transition-colors"
		in:scale={{ duration: 300, easing: quintInOut }}
		on:click={() => dispatch('action', { type: 'game-start' })}
	>
		Start
	</button>
</section>
