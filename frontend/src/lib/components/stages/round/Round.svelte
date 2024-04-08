<script lang="ts">
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale, slide } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'
	import Progress from '../../Progress.svelte'
	import Themes from './Themes.svelte'

	export let round: ViewState.RoundStage

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	$: showBackdrop = round.skipRoundVoting || round.appealVoting || round.appealResolution
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

	<Themes {round} on:action />

	{#if showBackdrop}
		<div class="absolute -inset-1 backdrop-blur-sm"></div>
	{/if}

	{#if round.skipRoundVoting}
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

	{#if round.appealResolution}
		<div
			transition:slide={{ delay: 300, duration: 300, easing: quintInOut }}
			class={cn(
				'absolute bottom-0 left-0 w-full rounded-md bg-bg-accent p-2 text-center text-text-accent',
				round.appealResolution === 'approved' && 'bg-green-600',
				round.appealResolution === 'rejected' && 'bg-danger'
			)}
		>
			{#if round.appealResolution === 'approved'}
				Одобряем!
			{:else}
				Отклоняем!
			{/if}
		</div>
	{:else if round.appealVoting}
		<div
			transition:slide={{ duration: 300, easing: quintInOut }}
			class="absolute bottom-0 left-0 w-full rounded-md bg-bg-accent p-2 text-text-accent"
		>
			<div class="mb-2 flex flex-wrap justify-center gap-2">
				<div>
					{round.appealVoting.playerName} ответил:
					<span class="font-bold">{round.appealVoting.answer}</span>
				</div>

				<div>
					Автор пака написал:
					{#each round.appealVoting.correctAnswers as answer, i}
						<span class="font-bold">{answer}</span>
						{#if i < round.appealVoting.correctAnswers.length - 1}
							<span> или </span>
						{/if}
					{/each}
				</div>
			</div>

			<div class="mb-2 flex flex-wrap justify-center gap-2">
				<div>{round.appealVoting.playerName} был прав?</div>
				<button
					class="rounded-md bg-bg-section px-2 text-text-normal disabled:text-text-neutral"
					disabled={round.appealVoting.meVoted}
					on:click={() => dispatch('action', { type: 'appeal-vote', vote: 'disagree' })}
				>
					Нет
				</button>
				<div>
					{round.appealVoting.disagree.length} | {round.appealVoting.agree.length}
				</div>
				<button
					class="rounded-md bg-bg-section px-2 text-text-normal disabled:text-text-neutral"
					disabled={round.appealVoting.meVoted}
					on:click={() => dispatch('action', { type: 'appeal-vote', vote: 'agree' })}
				>
					Да
				</button>
			</div>

			<Progress seconds={round.appealVoting.timeoutSeconds} color="font" />
		</div>
	{/if}
</section>
