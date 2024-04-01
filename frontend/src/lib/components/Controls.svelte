<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { StageSnapshot } from 'shared/models/models'
	import { createEventDispatcher } from 'svelte'
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'
	import Keydown from 'svelte-keydown'
	import { cn } from '$lib/style-utils'

	export let stage: StageSnapshot
	export let userId: string

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
	let answer = ''

	$: showAnswerInput =
		stage.type === 'question' &&
		stage.substate.type === 'awaiting-answer' &&
		stage.substate.activePlayerId === userId

	$: showAppealButton = stage.type === 'round' && stage.playerIdsCanAppeal.includes(userId)

	$: showHitButton = !showAnswerInput && !showAppealButton

	$: {
		if (showAnswerInput) {
			if (answerInput) {
				answerInput.focus()
			}
		} else {
			answer = ''
		}
	}

	let answerInput: HTMLInputElement

	let hitButton: HTMLButtonElement
	let buttonActive = false
	let alreadyHit = false

	const clickHit = (e: Event) => {
		if (hitButton && !alreadyHit) {
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

	$: buttonReadyForHit = stage.type === 'question' && stage.substate.type === 'ready-for-hit'
</script>

<Keydown pauseOnInput on:Space={clickHit} on:keyup={releaseHit} />

<section class="mx-auto w-full">
	{#if showHitButton}
		<button
			class={cn(
				'bg-bg-secondary h-10 w-full cursor-pointer rounded-lg border-none text-xl transition-colors duration-1000  active:bg-danger active:transition-none',
				{
					'bg-bg-accent text-text-accent': buttonReadyForHit,
				},
				{
					'bg-danger transition-none': buttonActive,
				}
			)}
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
	{#if showAppealButton}
		<button
			class="h-10 w-full cursor-pointer rounded-lg border-none bg-warn text-xl shadow-md"
			on:click={() => dispatch('action', { type: 'appeal-start' })}
			in:scale={{ duration: 300, easing: quintInOut }}
		>
			Я БЫЛ ПРАВ!
		</button>
	{/if}
	{#if showAnswerInput}
		<div class="relative w-full" in:scale={{ duration: 300, easing: quintInOut }}>
			<form
				class="flex h-10"
				on:submit|preventDefault={() =>
					dispatch('action', { type: 'answer-give', value: answer })}
			>
				<input
					class="bg-bg-secondary text-text-normal h-full flex-1 rounded-lg p-2 pr-12 text-center font-serif"
					type="text"
					placeholder="Пиши ответ"
					bind:value={answer}
					bind:this={answerInput}
				/>
				<button class="absolute right-0 px-2 py-1" disabled={!answer}>
					<svg
						class="text-text-normal h-8 w-8 rotate-90"
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
</section>
