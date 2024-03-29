<script lang="ts">
	import type { ExtendedPlayer, SvelteCustomEvent } from '$lib/models'
	import type { StageSnapshot } from 'shared/models/models'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	export let userId: string
	export let appeal: Extract<StageSnapshot, { type: 'appeal' }>
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

<section
	class="align-center flex h-full flex-col justify-center"
	in:scale={{ duration: 300, easing: quintInOut }}
>
	<div class="font-xl text-center font-bold">Appeal</div>

	<div class="mt-4">
		<div>
			<p>{appealingUserName}: <span class="font-bold">{appeal.answer}</span></p>
			<p>
				Pack author: <span class="font-bold">{appeal.model.answers.correct.join('; ')}</span
				>
			</p>
		</div>
		<div class="flex">
			<div class="flex flex-1 flex-col justify-between">
				<div class="m-4">
					{#each agreePlayerNames as player}
						<div>{player}</div>
					{/each}
				</div>
				<button
					class="rounded-bl-2xl bg-warn px-4 py-2"
					disabled={appeal.playerId === userId}
					on:click={() =>
						dispatch('action', { type: 'appeal-resolve', resolution: true })}
					>Agree</button
				>
			</div>
			<div class="flex flex-1 flex-col justify-between">
				<div class="m-4 text-right">
					{#each disagreePlayerNames as player}
						<div>{player}</div>
					{/each}
				</div>
				<button
					class="rounded-br-2xl bg-danger px-4 py-2"
					disabled={appeal.playerId === userId}
					on:click={() =>
						dispatch('action', { type: 'appeal-resolve', resolution: false })}
					>Disagree</button
				>
			</div>
		</div>
	</div>

	<div class="mt-4">
		<Progress seconds={appeal.timeoutSeconds} />
	</div>
</section>
