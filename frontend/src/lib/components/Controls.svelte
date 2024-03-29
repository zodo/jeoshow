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
				'h-12 w-full cursor-pointer rounded-3xl border-none bg-neutral text-2xl  shadow-md transition-colors duration-1000  active:bg-danger active:transition-none',
				{
					'bg-accent': buttonReadyForHit,
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
			Hit
		</button>
	{/if}
	{#if showAppealButton}
		<button
			class="h-12 w-full cursor-pointer rounded-3xl border-none bg-warn text-2xl shadow-md"
			on:click={() => dispatch('action', { type: 'appeal-start' })}
			in:scale={{ duration: 300, easing: quintInOut }}
		>
			Appeal!
		</button>
	{/if}
	{#if showAnswerInput}
		<div class="w-full drop-shadow-md" in:scale={{ duration: 300, easing: quintInOut }}>
			<form
				class="flex h-12"
				on:submit|preventDefault={() =>
					dispatch('action', { type: 'answer-give', value: answer })}
			>
				<input
					class="h-full flex-1 rounded-l-3xl p-2 text-center font-serif text-xl"
					type="text"
					placeholder="Your answer"
					bind:value={answer}
					bind:this={answerInput}
				/>
				<button
					class="rounded-r-3xl bg-warn px-4 py-2 transition-colors hover:bg-accent"
					disabled={!answer}
				>
					Give answer
				</button>
			</form>
		</div>
	{/if}
</section>
