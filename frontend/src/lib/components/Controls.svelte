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
	export let gameMode: 'classic' | 'party' = 'classic'

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

	let partyAnswer = ''
	let partyAnswerInput: HTMLInputElement
	let partySubmission: { value: string; bet: boolean } | 'pass' | null = null

	$: partyActive = controls.mode === 'answer-party'
	$: partyPlaceholder = partyActive
		? 'Ответ'
		: controls.mode === 'party-waiting' && controls.activePlayerName
			? `Выбирает ${controls.activePlayerName}`
			: ''

	$: partyWaitingName = controls.mode === 'party-waiting' ? controls.activePlayerName : undefined
	let prevControlsMode: string = ''
	let prevWaitingName: string | undefined = undefined
	$: if (controls.mode !== prevControlsMode || partyWaitingName !== prevWaitingName) {
		prevControlsMode = controls.mode
		prevWaitingName = partyWaitingName
		if (controls.mode === 'answer-party') {
			partySubmission = null
			partyAnswer = ''
			partyAnswerInput?.focus()
		} else if (controls.mode === 'party-waiting' && controls.activePlayerName) {
			partySubmission = null
			partyAnswer = ''
		} else if (controls.mode !== 'answer-party-select') {
			if (partySubmission) {
				partyAnswer = partySubmission === 'pass' ? 'ПАС' : partySubmission.value
			} else {
				partyAnswer = ''
			}
		}
	}

	let partySelectEnabled = false
	$: {
		if (controls.mode === 'answer-party-select') {
			setTimeout(() => {
				partySelectEnabled = true
			}, 1000)
		} else {
			partySelectEnabled = false
		}
	}

	const handlePartySubmit = () => {
		if (partyAnswer && partyActive) {
			partySubmission = { value: partyAnswer, bet: false }
			dispatch('action', { type: 'party-answer', value: partyAnswer, confidenceBet: false })
		}
	}

	const handlePartyx2 = () => {
		if (partyAnswer && partyActive) {
			partySubmission = { value: partyAnswer, bet: true }
			dispatch('action', { type: 'party-answer', value: partyAnswer, confidenceBet: true })
			dispatch('haptic', 'medium')
		}
	}

	const handlePartyPass = () => {
		partySubmission = 'pass'
		dispatch('action', { type: 'party-pass' })
	}

	afterUpdate(() => {
		if (browser) {
			window.scrollTo(0, 0)
		}
	})
</script>

<section class="mx-auto flex w-full gap-1">
	<div class="flex-1">
		{#if gameMode === 'party'}
			{#if controls.mode === 'answer-party-select'}
				<div class="relative w-full">
					<div class="flex h-10 gap-1">
						{#each controls.options as option}
							<button
								class="h-full flex-1 rounded-md border border-text-normal bg-bg-accent p-2 text-center text-text-accent transition-all enabled:border-b-2 disabled:bg-bg-secondary disabled:text-text-normal"
								on:click={() =>
									dispatch('action', {
										type: 'party-answer',
										value: option.name,
										confidenceBet: false,
									})}
								on:focus={(e) => e.preventDefault()}
								disabled={!partySelectEnabled}
							>
								{option.name}
							</button>
						{/each}
					</div>
					<div class="mt-1 flex gap-1">
						<button
							class="h-8 rounded-md border border-text-normal bg-bg-secondary px-3 text-sm font-bold text-text-neutral"
							on:click={handlePartyPass}
						>
							Пас
						</button>
						{#each controls.options as option}
							<button
								class="h-8 flex-1 rounded-md border border-danger bg-danger text-xs font-black text-white transition-all enabled:border-b-2 disabled:opacity-40"
								on:click={() => {
									dispatch('action', {
										type: 'party-answer',
										value: option.name,
										confidenceBet: true,
									})
									dispatch('haptic', 'medium')
								}}
								on:focus={(e) => e.preventDefault()}
								disabled={!partySelectEnabled}
							>
								x2 {option.name}
							</button>
						{/each}
					</div>
				</div>
			{:else}
				<form on:submit|preventDefault={handlePartySubmit} class="flex flex-wrap gap-1">
					<button
						type="button"
						class="h-10 rounded-md border border-text-normal bg-bg-secondary px-4 text-sm font-bold text-text-normal transition-all enabled:border-b-2 disabled:text-text-neutral disabled:opacity-30"
						disabled={!partyActive}
						on:click={handlePartyPass}
					>
						Пас
					</button>
					<div class="relative order-first w-full md:order-none md:w-auto md:flex-1">
						<input
							class="h-10 w-full rounded-md border-2 border-text-normal bg-bg-secondary p-2 text-center font-serif font-bold text-text-normal outline-none transition-all enabled:border-b-4 disabled:opacity-40"
							type="text"
							placeholder={partyPlaceholder}
							disabled={!partyActive}
							bind:value={partyAnswer}
							bind:this={partyAnswerInput}
							on:paste={(e) => e.preventDefault()}
						/>
						{#if partySubmission && partySubmission !== 'pass' && partySubmission.bet}
							<span
								class="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full border-2 border-danger text-[11px] font-black text-danger opacity-40"
								>x2</span
							>
						{/if}
					</div>
					<button
						type="submit"
						class="h-10 flex-1 rounded-md border border-text-normal bg-bg-accent text-sm font-bold text-text-accent transition-all enabled:border-b-2 disabled:opacity-30 md:flex-none md:px-4"
						disabled={!partyActive}
					>
						Ответить
					</button>
					<button
						type="button"
						class="h-10 flex-1 rounded-md border border-text-normal bg-danger text-sm font-bold text-white transition-all enabled:border-b-2 disabled:opacity-30 md:flex-none md:px-4"
						disabled={!partyActive}
						on:click={handlePartyx2}
					>
						Ответить <span
							class="inline-flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/50 bg-white text-[10px] font-black text-danger"
							>x2</span
						>
					</button>
				</form>
			{/if}
		{:else}
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

			{#if controls.mode === 'llm-checking'}
				<div
					in:scale={{ duration: 300, easing: quintInOut }}
					class="h-10 animate-pulse rounded-md border-2 border-b-4 border-text-normal bg-bg-accent p-1 text-center font-bold text-text-accent"
				>
					Судья проверяет...
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
		{/if}
	</div>

	{#if gameMode === 'classic' && controls.mode !== 'answer-text' && controls.mode !== 'answer-select' && controls.mode !== 'answer-attempt' && controls.mode !== 'llm-checking'}
		<div class="flex-0">
			<ReactionSelector on:haptic on:action />
		</div>
	{/if}
</section>
