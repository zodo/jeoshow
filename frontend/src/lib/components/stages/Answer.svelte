<script lang="ts">
	import MediaFragment from '../MediaFragment.svelte'
	import type { ViewState } from '$lib/models'
	import type { PackModel } from 'shared/models/siq'
	import { assertNever } from 'shared/utils/assert-never'

	export let answer: ViewState.AnswerStage

	let fragments: PackModel.FragmentGroup[] = []
	$: {
		if (answer.model.type === 'regular') {
			fragments = answer.model.content
		} else if (answer.model.type === 'select') {
			const correctName = answer.model.correctName
			const answerText = answer.model.options.find((o) => o.name === correctName)?.text
			fragments = [[{ type: 'text', value: answerText ?? 'хз' }]]
		} else {
			assertNever(answer.model)
		}
	}
</script>

<section class="grid h-full grid-rows-[min-content_1fr]">
	<div class="font-xl text-center font-bold">{answer.theme}</div>

	<div class="overflow-scroll">
		<MediaFragment {fragments} on:action />
	</div>
</section>
