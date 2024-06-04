<script lang="ts">
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { afterUpdate, createEventDispatcher } from 'svelte'
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'
	import { cn } from '$lib/style-utils'
	import { browser } from '$app/environment'
	import HitButton from './HitButton.svelte'
	import ReactionSelector from './ReactionSelector.svelte'

	export let controls: ViewState.Controls

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let timeout: NodeJS.Timeout | undefined
	const dispatchDebounced = () => {
		if (!timeout) {
			timeout = setTimeout(() => {
				if (answer) {
					dispatch('action', { type: 'answer-typing', value: answer })
				}
				timeout = undefined
			}, 100)
		}
	}

	$: answer, dispatchDebounced()

	$: {
		if (controls.mode === 'answer-text') {
			if (answerInput) {
				answerInput.focus()
			}
		} else {
			answer = ''
		}
	}

	let selectAnswersEnabled = false
	$: {
		if (controls.mode === 'answer-select') {
			setTimeout(() => {
				selectAnswersEnabled = true
			}, 1000)
		} else {
			selectAnswersEnabled = false
		}
	}

	let answer = ''
	let answerInput: HTMLInputElement

	afterUpdate(() => {
		if (browser) {
			window.scrollTo(0, 0)
		}
	})
</script>

<section in:scale={{ duration: 800, easing: quintInOut }} class="mx-auto flex w-full gap-1">
	<div class="flex-1">
		{#if controls.mode === 'hit'}
			<HitButton on:action {controls} on:haptic />
		{/if}
		{#if controls.mode === 'appeal'}
			<button
				class="relative h-full w-full cursor-pointer rounded-lg border-2 border-text-normal bg-bg-secondary"
				on:click={() => dispatch('action', { type: 'appeal-vote', vote: 'agree' })}
				in:scale={{ duration: 300, easing: quintInOut }}
			>
				<span
					class="relative -mx-0.5 flex h-full w-auto -translate-y-1 select-none items-center justify-center rounded-lg border-2 border-text-normal bg-warn text-center text-sm font-bold uppercase text-text-normal transition-transform ease-in-out hover:-translate-y-1.5 active:-translate-y-0.5 active:transition-all active:duration-100"
				>
					я был прав!
				</span>
			</button>
		{/if}
		{#if controls.mode === 'answer-text'}
			<div class="relative w-full" in:scale={{ duration: 300, easing: quintInOut }}>
				<form
					class="flex h-10"
					on:submit|preventDefault={() =>
						dispatch('action', { type: 'answer-give', value: answer })}
				>
					<input
						class="h-full flex-1 rounded-md border-2 border-b-4 border-text-normal bg-bg-secondary p-2 pr-12 text-center font-serif font-bold text-text-normal outline-none"
						type="text"
						placeholder="Пиши ответ"
						bind:value={answer}
						bind:this={answerInput}
						on:paste={(e) => e.preventDefault()}
					/>
					<button class="absolute right-0 px-2 py-1" disabled={!answer}>
						<svg
							class="h-8 w-8 rotate-90 text-text-normal"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								fill-rule="evenodd"
								d="M12 2a1 1 0 0 1 .932.638l7 18a1 1 0 0 1-1.326 1.281L13 19.517V13a1 1 0 1 0-2 0v6.517l-5.606 2.402a1 1 0 0 1-1.326-1.281l7-18A1 1 0 0 1 12 2Z"
								clip-rule="evenodd"
							/>
						</svg>
					</button>
				</form>
			</div>
		{/if}

		{#if controls.mode === 'answer-select'}
			<div class="relative h-10 w-full" in:scale={{ duration: 300, easing: quintInOut }}>
				<div class="flex gap-2">
					{#each controls.options as option}
						<button
							class="h-full flex-1 rounded-md border border-b-2 border-text-normal bg-bg-accent p-2 text-center text-text-accent transition-colors disabled:bg-bg-secondary disabled:text-text-normal"
							on:click={() =>
								dispatch('action', { type: 'answer-give', value: option.name })}
							on:focus={(e) => e.preventDefault()}
							disabled={!selectAnswersEnabled}
						>
							{option.name}
						</button>
					{/each}
				</div>
			</div>
		{/if}

		{#if controls.mode === 'answer-attempt'}
			<div
				in:scale={{ duration: 300, easing: quintInOut }}
				class={cn(
					'h-10 rounded-md border-2 border-b-4 border-text-normal bg-bg-accent p-1 text-center font-bold text-text-accent',
					controls.correct && 'bg-green-600',
					!controls.correct && 'bg-danger'
				)}
			>
				{#if controls.correct}
					Верно!
				{:else}
					Неправильно
				{/if}
			</div>
		{/if}

		{#if controls.mode === 'answer-skip'}
			<button
				class="relative h-full w-full cursor-pointer rounded-lg border-2 border-text-normal bg-bg-secondary"
				on:click={() => dispatch('action', { type: 'answer-skip' })}
				in:scale={{ duration: 300, easing: quintInOut }}
			>
				<span
					class={cn(
						'relative -mx-0.5 flex h-full w-auto -translate-y-1 select-none items-center justify-center rounded-lg border-2 border-text-normal bg-bg-secondary text-center text-sm font-bold uppercase text-text-normal transition-transform ease-in-out hover:-translate-y-1.5 active:-translate-y-0.5 active:transition-all active:duration-100',
						{
							'bg-bg-accent text-text-accent shadow-md ': controls.votes > 0,
						}
					)}
				>
					{#if controls.meVoted}
						Пропускаем ({controls.votes} / {controls.totalPlayers})
					{:else}
						Пропустить
					{/if}
				</span>
			</button>
		{/if}
	</div>

	{#if controls.mode !== 'answer-text' && controls.mode !== 'answer-select' && controls.mode !== 'answer-attempt'}
		<div class="flex-0">
			<ReactionSelector on:haptic on:action />
		</div>
	{/if}
</section>
