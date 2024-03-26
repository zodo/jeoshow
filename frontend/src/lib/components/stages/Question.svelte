<script lang="ts">
	import type { StageSnapshot } from 'shared/models/models'
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'

	export let question: Extract<StageSnapshot, { type: 'question' }>
</script>

<section>
	<div>
		<div class="theme">{question.theme}</div>
		{#if question.themeComment}
			<div class="theme-comment">{question.themeComment}</div>
		{/if}
	</div>

	<div class="fragments">
		<MediaFragment fragments={question.fragments} on:action />
	</div>

	<div class="progress">
		{#if question.substate.type === 'ready-for-hit' && question.substate.timeoutSeconds}
			<Progress seconds={question.substate.timeoutSeconds} />
		{/if}

		{#if question.substate.type === 'awaiting-answer' && question.substate.timeoutSeconds}
			<Progress seconds={question.substate.timeoutSeconds} />
		{/if}
	</div>
</section>

<style>
	section {
		display: grid;
		grid-template-rows: min-content 1fr min-content;
		height: 100%;
	}

	.theme {
		font-weight: bold;
		font-size: 1.5rem;
		text-align: center;
	}

	.theme-comment {
		font-size: 1rem;
		font-style: italic;
		text-align: center;
	}

	.fragments {
		overflow: scroll;
	}

	.progress {
		width: 100%;
		height: 1rem;
	}
</style>
