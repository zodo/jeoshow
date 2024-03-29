<script lang="ts">
	import type { StageSnapshot } from 'shared/models/models'
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'

	export let question: Extract<StageSnapshot, { type: 'question' }>
</script>

<section class="grid h-full grid-rows-[min-content_1fr_min-content]">
	<div class="text-center">
		<div class="text-xl font-bold">{question.theme}</div>
		{#if question.themeComment}
			<div class="mt-1 text-sm italic">{question.themeComment}</div>
		{/if}
	</div>

	<div class="overflow-scroll">
		<MediaFragment fragments={question.fragments} on:action />
	</div>

	<div class="h-4 w-full">
		{#if question.substate.type === 'ready-for-hit' && question.substate.timeoutSeconds}
			<Progress seconds={question.substate.timeoutSeconds} />
		{/if}

		{#if question.substate.type === 'awaiting-answer' && question.substate.timeoutSeconds}
			<Progress seconds={question.substate.timeoutSeconds} />
		{/if}
	</div>
</section>
