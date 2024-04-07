<script lang="ts">
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale, slide } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'
	import Progress from '../Progress.svelte'

	export let round: ViewState.RoundStage

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	const selectQuestion = (questionId: string) => {
		if (round.meActive && !round.skipRoundVoting) {
			dispatch('action', { type: 'question-select', questionId })
		}
	}
</script>

<section
	class="relative grid h-full w-full select-none grid-rows-[min-content_1fr] gap-2"
	in:scale={{ delay: 300, duration: 300, easing: quintInOut }}
	out:scale={{ duration: 300, easing: quintInOut }}
>
	<div class="text-center">
		<div class="text-sm font-bold">
			{round.name}
			<button
				class="ml-1 inline-block h-4 w-4"
				on:click={() => dispatch('action', { type: 'round-skip', vote: 'yes' })}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 24 24"
					stroke-width="1.5"
					stroke="currentColor"
					class="inline-block h-4 w-4"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="m5.25 4.5 7.5 7.5-7.5 7.5m6-15 7.5 7.5-7.5 7.5"
					/>
				</svg>
			</button>
		</div>
		{#if round.comments}
			<div class="mt-2 text-sm italic">{round.comments}</div>
		{/if}
	</div>
	<div class="flex flex-col items-center justify-evenly overflow-x-auto px-2">
		{#each round.themes as { name, questions }}
			<div>
				<h3 class="text-center text-xs font-bold text-text-header">{name}</h3>
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
			</div>
		{/each}
	</div>

	{#if round.skipRoundVoting}
		<div class="absolute inset-0 backdrop-blur-sm"></div>
		<div
			transition:slide={{ duration: 300, easing: quintInOut }}
			class="absolute bottom-0 left-0 w-full rounded-md bg-bg-accent p-2 text-text-accent"
		>
			<div class="mb-2 flex flex-wrap justify-center gap-2">
				<div>Пропускаем раунд?</div>
				<button
					class="rounded-md bg-bg-section px-2 text-text-normal disabled:text-text-neutral"
					disabled={round.skipRoundVoting.meVoted}
					on:click={() => dispatch('action', { type: 'round-skip', vote: 'no' })}
				>
					Нет
				</button>
				<div>
					{round.skipRoundVoting.no.length} | {round.skipRoundVoting.yes.length}
				</div>
				<button
					class="rounded-md bg-bg-section px-2 text-text-normal disabled:text-text-neutral"
					disabled={round.skipRoundVoting.meVoted}
					on:click={() => dispatch('action', { type: 'round-skip', vote: 'yes' })}
				>
					Да
				</button>
			</div>

			<Progress seconds={round.skipRoundVoting.timeoutSeconds} color="font" />
		</div>
	{/if}
</section>
