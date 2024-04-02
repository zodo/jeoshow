<script lang="ts">
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'
	import type { ViewState } from '$lib/models'

	export let question: ViewState.QuestionStage
</script>

<section class="grid h-full grid-rows-[min-content_1fr_min-content] gap-2">
	<div class="text-center">
		<div class="text-xl font-bold">{question.theme}</div>
		{#if question.themeComment}
			<div class="mt-1 text-sm italic">{question.themeComment}</div>
		{/if}
	</div>

	<div class="overflow-scroll">
		<MediaFragment fragments={question.fragments} on:action />
	</div>

	{#if question.awaitingAnswer?.awaiting && !question.awaitingAnswer.isMe}
		<div class="flex max-w-full flex-wrap rounded-md bg-bg-accent p-4">
			<div class="mr-2">
				Отвечает {question.awaitingAnswer.playerName}:
			</div>
			<div class="after:animate-blink-cursor font-serif after:font-bold after:content-['|']">
				{question.awaitingAnswer.answer}
			</div>
		</div>
	{/if}

	{#if question.readyForHit?.ready && question.readyForHit?.timeoutSeconds}
		<div class="h-4 w-full">
			<Progress seconds={question.readyForHit.timeoutSeconds} />
		</div>
	{/if}

	{#if question.awaitingAnswer?.awaiting && question.awaitingAnswer.isMe && question.awaitingAnswer.timeoutSeconds}
		<div class="h-4 w-full">
			<Progress seconds={question.awaitingAnswer.timeoutSeconds} />
		</div>
	{/if}
</section>
