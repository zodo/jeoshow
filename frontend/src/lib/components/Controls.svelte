<script lang="ts">
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { afterUpdate, createEventDispatcher } from 'svelte'
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'
	import Keydown from 'svelte-keydown'
	import { cn } from '$lib/style-utils'
	import { browser } from '$app/environment'

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
	let hitButton: HTMLButtonElement
	let buttonActive = false
	let alreadyHit = false

	const clickHit = (e: TouchEvent | MouseEvent | CustomEvent) => {
		const isSecondTouch = (e as TouchEvent).touches && (e as TouchEvent).touches.length > 1
		if (hitButton && !alreadyHit && !isSecondTouch) {
			hitButton.click()
			dispatch('action', { type: 'button-hit' })
			buttonActive = true
			setTimeout(() => {
				buttonActive = false
			}, 100)
			alreadyHit = true
		}
	}

	const releaseHit = () => {
		alreadyHit = false
	}

	afterUpdate(() => {
		if (browser) {
			window.scrollTo(0, 0)
		}
	})
</script>

<Keydown pauseOnInput on:Space={clickHit} on:keyup={releaseHit} />

<section in:scale={{ duration: 800, easing: quintInOut }} class="mx-auto w-full">
	{#if controls.mode === 'hit'}
		<button
			class={cn(
				'h-10 w-full cursor-pointer rounded-lg border-none bg-bg-secondary text-xl transition-colors duration-1000  active:bg-danger active:transition-none',
				{
					'bg-bg-accent text-text-accent': controls.ready && !controls.falselyStart,
				},
				{
					'bg-warn transition-none': buttonActive && controls.falselyStart,
				},
				{
					'bg-danger transition-none': buttonActive && !controls.falselyStart,
				}
			)}
			on:click|preventDefault
			on:mousedown={clickHit}
			on:mouseup={releaseHit}
			on:touchstart={clickHit}
			on:touchend={releaseHit}
			in:scale={{ duration: 300, easing: quintInOut }}
			bind:this={hitButton}
		>
			ЖМИ!
		</button>
	{/if}
	{#if controls.mode === 'appeal'}
		<button
			class="h-10 w-full cursor-pointer rounded-lg border-none bg-warn text-xl shadow-md"
			on:click={() => dispatch('action', { type: 'appeal-vote', vote: 'agree' })}
			in:scale={{ duration: 300, easing: quintInOut }}
		>
			Я БЫЛ ПРАВ!
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
					class="h-full flex-1 rounded-lg bg-bg-secondary p-2 pr-12 text-center font-serif text-text-normal"
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
						class="h-full flex-1 rounded-lg bg-bg-accent p-2 text-center text-text-accent transition-colors disabled:bg-bg-secondary disabled:text-text-normal"
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
				'h-10 rounded-md bg-bg-accent p-2 text-center text-text-accent shadow-md',
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
</section>
