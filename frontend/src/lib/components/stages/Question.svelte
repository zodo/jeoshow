<script lang="ts">
	import type { GameEvents } from 'shared/models/events'
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'

	export let question: Extract<GameEvents.StageSnapshot, { type: 'question' }>
</script>

<section>
	<div class="header">
		<div class="theme">{question.theme}</div>
		{#if question.themeComment}
			<div class="theme-comment">{question.themeComment}</div>
		{/if}
	</div>

	<div class="fragments">
		<MediaFragment fragments={question.fragments} on:action />
	</div>

	<div class="progress">
		{#if (question.substate.type === 'ready-for-hit' || question.substate.type === 'awaiting-answer') && question.substate.timeoutSeconds}
			{#key question.substate.type}
				<Progress seconds={question.substate.timeoutSeconds} />
			{/key}
		{/if}
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
	}

	.header {
		margin-top: 1rem;
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
		height: 100%;
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin: 1rem;
	}

	.progress {
		width: 100%;
		height: 3.5rem;
		padding: 1rem;
	}
</style>
