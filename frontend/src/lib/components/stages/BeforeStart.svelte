<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
</script>

<section class="flex h-full items-center justify-center">
	<button
		class="relative cursor-pointer rounded-lg border-2 border-text-normal bg-bg-secondary"
		transition:scale={{ duration: 300, easing: quintInOut }}
		on:click={() => dispatch('action', { type: 'game-start' })}
	>
		<span
			class="relative -mx-0.5 flex h-full w-auto -translate-y-1 select-none items-center justify-center rounded-lg border-2 border-text-normal bg-bg-accent px-4 py-2 text-center text-sm font-bold uppercase text-text-accent transition-transform ease-in-out hover:-translate-y-1.5 active:-translate-y-0.5 active:transition-all active:duration-100"
		>
			Начинаем
		</span>
	</button>
</section>
