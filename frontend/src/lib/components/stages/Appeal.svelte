<script lang="ts">
	import type { SvelteCustomEvent, ViewState } from '$lib/models'
	import { assertNever } from 'shared/utils/assert-never'
	import { createEventDispatcher } from 'svelte'
	import Progress from '../Progress.svelte'
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	export let appeal: ViewState.AppealStage
	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let playerAnswer: string
	let authorAnswer: string
	$: {
		const answers = appeal.model.answers
		if (answers.type === 'regular') {
			playerAnswer = appeal.answer
			authorAnswer = answers.correct.join('; ')
		} else if (answers.type === 'select') {
			// no appeals available for select answers
		} else {
			assertNever(answers)
		}
	}
</script>

<section
	class="align-center flex h-full flex-col justify-center"
	in:scale={{ duration: 300, easing: quintInOut }}
>
	<div class="font-xl text-center font-bold">Appeal</div>

	<div class="mt-4">
		<div>
			<p>{appeal.playerName}: <span class="font-bold">{playerAnswer}</span></p>
			<p>
				Pack author: <span class="font-bold">{authorAnswer}</span>
			</p>
		</div>
		<div class="flex">
			<div class="flex flex-1 flex-col justify-between">
				<div class="m-4">
					{#each appeal.agreePlayers as player}
						<div>{player}</div>
					{/each}
				</div>
				<button
					class="rounded-bl-2xl bg-warn px-4 py-2"
					disabled={appeal.isMe}
					on:click={() =>
						dispatch('action', { type: 'appeal-resolve', resolution: true })}
					>Agree</button
				>
			</div>
			<div class="flex flex-1 flex-col justify-between">
				<div class="m-4 text-right">
					{#each appeal.disagreePlayers as player}
						<div>{player}</div>
					{/each}
				</div>
				<button
					class="rounded-br-2xl bg-danger px-4 py-2"
					disabled={appeal.isMe}
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
