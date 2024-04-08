<script lang="ts">
	import type { ViewState, SvelteCustomEvent } from '$lib/models'
	import { cn } from '$lib/style-utils'
	import { createEventDispatcher, onMount } from 'svelte'

	export let round: ViewState.RoundStage
	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		if (round.meActive && !round.skipRoundVoting) {
			dispatch('action', { type: 'question-select', questionId })
		}
	}

	let container: HTMLDivElement
	let contentOverflows = false
	const checkOverflow = () => {
		if (container?.children) {
			const childHeightSum = Array.from(container.children).reduce(
				(sum, child) => sum + child.clientHeight,
				0
			)
			contentOverflows = childHeightSum > container.clientHeight
		} else {
			contentOverflows = false
		}
	}

	onMount(() => {
		checkOverflow()
	})
</script>

<svelte:window on:resize={checkOverflow} />

<div
	bind:this={container}
	class={cn(
		'flex flex-col items-center justify-center gap-1 overflow-x-auto px-2',
		contentOverflows && 'justify-start'
	)}
>
	{#each round.themes as { name, questions }}
		<div>
			<h3 class="text-center text-xs font-bold text-text-header">{name}</h3>
			<div class="flex flex-wrap justify-center">
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
		</div>
	{/each}
</div>
