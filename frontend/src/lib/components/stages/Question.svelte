<script lang="ts">
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'
	import type { ViewState } from '$lib/models'

	export let question: ViewState.QuestionStage

	$: timeoutSeconds = question.readyForHit
		? question.readyForHit.timeoutSeconds
		: question.awaitingAnswerTimeoutSeconds
</script>

<section class="relative grid h-full grid-rows-[min-content_1fr_min-content] gap-2">
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
