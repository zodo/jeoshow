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
	class="flex h-full select-none items-center justify-center"
	in:scale={{ duration: 300, easing: quintInOut }}
>
	<div class="w-full overflow-x-auto">
		<div class="text-center">
			<div class="text-xl font-bold">{round.name}</div>
			{#if round.comments}
				<div class="mt-2 text-sm italic">{round.comments}</div>
			{/if}
		</div>
		<table class="mx-auto my-4 w-full border-collapse">
			<tbody>
				{#each round.themes as { name, questions }}
					<tr class="border-b-2 border-b-neutral last:border-none">
						<td class="max-w-40 px-3 py-2 text-left transition-colors">{name}</td>
						{#each questions as { id, price, available }}
							<td
								class={cn(
									'px-2 py-2 text-center transition-colors',
									available && isActiveUser && 'cursor-pointer hover:bg-accent',
									!available && 'text-neutral'
								)}
								on:click={() => selectQuestion(id)}
							>
								{price}
							</td>
						{/each}
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
