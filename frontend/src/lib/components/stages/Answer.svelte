<script lang="ts">
	import type { GameEvents } from 'shared/models/events'
	import MediaFragment from '../MediaFragment.svelte'

	export let answer: Extract<GameEvents.StageSnapshot, { type: 'answer' }>
</script>

<div class="answer-container">
	<div class="theme">Theme: {answer.theme}</div>
	<MediaFragment fragments={answer.model.content} on:action />
</div>

<style>
	.answer-container {
		margin: 20px;
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 8px;
	}
	.theme {
		font-weight: bold;
		margin-bottom: 10px;
	}
</style>
