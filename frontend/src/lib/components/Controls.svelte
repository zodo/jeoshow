<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher, onMount } from 'svelte'
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	export let stage: GameEvents.StageSnapshot
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
		if (!showAnswerInput) {
			answer = ''
		}
	}
</script>

<section>
	{#if showHitButton}
		<button
			on:click={() => dispatch('action', { type: 'button-hit' })}
			class="base-button hit-button"
			class:ready={stage.type === 'question' && stage.substate.type === 'ready-for-hit'}
			in:scale={{ duration: 300, easing: quintInOut }}
		>
			Hit
		</button>
	{/if}
	{#if showAppealButton}
		<button
			class="base-button appeal-button"
			on:click={() => dispatch('action', { type: 'appeal-start' })}
			in:scale={{ duration: 300, easing: quintInOut }}
		>
			Appeal!
		</button>
	{/if}
	{#if showAnswerInput}
		<div class="answer" in:scale={{ duration: 300, easing: quintInOut }}>
			<form
				on:submit|preventDefault={() =>
					dispatch('action', { type: 'answer-give', value: answer })}
			>
				<input type="text" placeholder="Your answer" bind:value={answer} />
				<button disabled={!answer}> Give answer </button>
			</form>
		</div>
	{/if}
</section>

<style>
	section {
		width: 100%;
		max-width: 600px;
		margin: 0 auto;
	}

	.base-button {
		width: 100%;
		height: 3rem;
		font-size: 1.5rem;
		background-color: var(--color-neutral);
		border: none;
		border-radius: 1.5rem;
		cursor: pointer;
		transition: background-color 0.8s;
	}

	.hit-button {
		height: 3rem;
		font-size: 1.5rem;
		background-color: var(--color-neutral);
		border: none;
		border-radius: 1.5rem;
		cursor: pointer;
		transition: background-color 0.8s;
	}

	.hit-button.ready {
		transition: none;
		background-color: var(--color-accent);
	}

	.hit-button:active {
		transition: none;
		background-color: var(--color-danger);
	}

	.answer {
		width: 100%;
	}

	.answer form {
		display: flex;
		height: 3rem;
	}

	.answer input {
		height: 100%;
		flex: 1;
		padding: 0.5rem;
		font-size: 1.5rem;
		border: none;
		border-radius: 1.5rem 0 0 1.5rem;
		text-align: center;
		font-family: var(--font-serif);
	}

	.answer button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border: none;
		border-radius: 0 1.5rem 1.5rem 0;
		background-color: var(--color-accent);
		cursor: pointer;
		transition: background-color 0.3s;
	}

	.appeal-button {
		background-color: var(--color-warn);
	}
</style>
