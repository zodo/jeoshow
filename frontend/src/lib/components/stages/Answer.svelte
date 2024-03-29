<script lang="ts">
	import type { StageSnapshot } from 'shared/models/models'
	import MediaFragment from '../MediaFragment.svelte'

	export let answer: Extract<StageSnapshot, { type: 'answer' }>
</script>

<section class="grid h-full grid-rows-[min-content_1fr_min-content]">
	<div class="font-xl text-center font-bold">{answer.theme}</div>

	<div class="overflow-scroll">
		<MediaFragment fragments={answer.model.content} on:action />
	</div>
</section>
