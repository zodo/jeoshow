<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { StageSnapshot } from 'shared/models/models'
	import { createEventDispatcher } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'

	export let userId: string
	export let round: Extract<StageSnapshot, { type: 'round' }>

	const isActiveUser = userId === round.activePlayerId

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		if (isActiveUser) {
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
			<h3 class="text-text-header text-xs font-bold">{name}</h3>
			<div class="flex flex-wrap">
				{#each questions as { id, price, available }}
					<button
						type="button"
						class={cn(
							'text-text-normal w-15 px-2 py-2 transition-colors',
							available &&
								isActiveUser &&
								'hover:bg-bg-accent hover:text-text-accent cursor-pointer',
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
