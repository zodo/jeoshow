<script lang="ts">
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'
	import type { ViewState } from '$lib/models'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import type { PackModel } from 'shared/models/siq'
	import { modifyMediaUrl } from '$lib/game-state'
	import { onMount } from 'svelte'

	export let question: ViewState.QuestionStage

	$: timeoutSeconds = question.readyForHit
		? question.readyForHit.timeoutSeconds
		: question.awaitingAnswerTimeoutSeconds

	let preloadedImages: string[] = []
	$: preloadedImages = question.fragments
		.flatMap((f) => f)
		.filter((f): f is PackModel.Image => f.type === 'image')
		.map((f) => modifyMediaUrl(f.url))

	let mounted = false

	onMount(() => {
		mounted = true
	})
</script>

{#if question.showIntroduction && mounted}
	<section
		in:scale={{ delay: 300, duration: 300, easing: quintInOut }}
		out:scale={{ duration: 300, easing: quintInOut }}
		class="flex h-full flex-col items-center justify-center text-center font-bold"
	>
		<h3 class="text-lg font-bold text-text-header">
			{question.theme}
		</h3>
		<div class="text-xl">
			{question.price}
		</div>
	</section>
{/if}

{#if !question.showIntroduction && mounted}
	<section class="relative grid h-full grid-rows-[min-content_1fr_1rem] gap-2">
		<div class="text-center">
			<div class="text-xl font-bold">{question.theme}</div>
			{#if question.themeComment}
				<div class="mt-1 text-sm italic">{question.themeComment}</div>
			{/if}
		</div>

		<div class="overflow-scroll">
			<MediaFragment fragments={question.fragments} on:action />
		</div>

		{#if timeoutSeconds}
			{#key !!question.readyForHit}
				<div class="h-4 w-full">
					<Progress seconds={timeoutSeconds} />
				</div>
			{/key}
		{/if}
	</section>
{/if}

<svelte:head>
	{#each preloadedImages as url}
		<link rel="preload" as="image" href={url} />
	{/each}
</svelte:head>
