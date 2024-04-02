<script lang="ts">
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'

	export let round: ViewState.RoundStage

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		if (round.meActive) {
			dispatch('action', { type: 'question-select', questionId })
		}
	}
</script>

<section
	class="grid h-full w-full select-none grid-rows-[min-content_1fr] gap-2"
	in:scale={{ duration: 300, easing: quintInOut }}
>
	<div class="text-center">
		<div class="text-sm font-bold">{round.name}</div>
		{#if round.comments}
			<div class="mt-2 text-sm italic">{round.comments}</div>
		{/if}
	</div>
	<div class="flex flex-col items-center overflow-x-auto px-2 justify-center-safe">
		{#each round.themes as { name, questions }}
			<h3 class="text-xs font-bold text-text-header">{name}</h3>
			<div class="flex flex-wrap">
				{#each questions as { id, price, available }}
					<button
						type="button"
						class={cn(
							'w-15 px-2 py-2 text-text-normal transition-colors',
							available &&
								round.meActive &&
								'cursor-pointer hover:bg-bg-accent hover:text-text-accent',
							!available && 'text-text-neutral opacity-30'
						)}
						on:click={() => selectQuestion(id)}
					>
						{price}
					</button>
				{/each}
			</div>
		{/each}
	</div>
</section>
