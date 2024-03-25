<script lang="ts">
	import type { ExtendedPlayer, SvelteCustomEvent } from '$lib/models'
	import type { GameEvents } from 'shared/models/events'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	export let userId: string
	export let appeal: Extract<GameEvents.StageSnapshot, { type: 'appeal' }>
	export let players: ExtendedPlayer[] = []

	$: appealingUserName = players.find((p) => p.id === appeal.playerId)?.name

	$: agreePlayerNames = appeal.resolutions
		.filter((r) => r.resolution)
		.map((r) => players.find((p) => p.id === r.playerId)?.name)
	$: disagreePlayerNames = appeal.resolutions
		.filter((r) => !r.resolution)
		.map((r) => players.find((p) => p.id === r.playerId)?.name)

	const dispatch = createEventDispatcher<SvelteCustomEvent>()
</script>

<section transition:scale={{ duration: 300, easing: quintInOut }}>
	<div class="header">Appeal</div>

	<div class="content">
		<div class="answers">
			<p>{appealingUserName}: {appeal.answer}</p>
			<p>Pack author: {appeal.model.answers.correct.join('. ')}</p>
		</div>
		<div class="votes">
			<div>
				<div class="player-names">
					{#each agreePlayerNames as player}
						<div>{player}</div>
					{/each}
				</div>
				<button
					class="agree"
					disabled={appeal.playerId === userId}
					on:click={() =>
						dispatch('action', { type: 'appeal-resolve', resolution: true })}
					>Agree</button
				>
			</div>
			<div>
				<div class="player-names">
					{#each disagreePlayerNames as player}
						<div>{player}</div>
					{/each}
				</div>
				<button
					class="disagree"
					disabled={appeal.playerId === userId}
					on:click={() =>
						dispatch('action', { type: 'appeal-resolve', resolution: false })}
					>Disagree</button
				>
			</div>
		</div>
	</div>

	<div class="progress">
		<Progress seconds={appeal.timeoutSeconds} />
	</div>
</section>

<style>
	.progress {
		width: 100%;
		height: 3.5rem;
		padding: 1rem;
	}

	.header {
		padding-top: 1rem;
		font-weight: bold;
		font-size: 1.5rem;
		text-align: center;
	}

	section {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
	}

	.content {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: 1.2rem;
	}

	.votes {
		display: flex;
		justify-content: space-around;
	}

	.votes > div {
		flex: 1 1 50%;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.player-names {
		margin: 1rem;
	}

	.votes > div:last-child .player-names {
		text-align: right;
	}

	button {
		padding: 0.5rem 1rem;
		font-size: 1rem;
		border: none;
		cursor: pointer;
	}

	button.agree {
		background-color: var(--color-accent);
		border-radius: 0 0 0 1rem;
	}

	button.disagree {
		background-color: var(--color-danger);
		border-radius: 0 0 1rem 0;
	}
</style>
