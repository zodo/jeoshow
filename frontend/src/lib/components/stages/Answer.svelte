<script lang="ts">
	import MediaFragment from '../MediaFragment.svelte'
	import type { ViewState } from '$lib/models'

	export let answer: ViewState.AnswerStage
</script>

<section class="grid h-full grid-rows-[min-content_1fr_min-content]">
	<div class="font-xl text-center font-bold">{answer.theme}</div>

	<div class="overflow-scroll">
		<MediaFragment fragments={answer.model.content} on:action />
	</div>
</section>
