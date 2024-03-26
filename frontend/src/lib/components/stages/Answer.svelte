<script lang="ts">
	import type { GameEvents } from 'shared/models/events'
	import MediaFragment from '../MediaFragment.svelte'

	export let answer: Extract<GameEvents.StageSnapshot, { type: 'answer' }>
</script>

<section>
	<div class="theme">{answer.theme}</div>

	<div class="fragments">
		<MediaFragment fragments={answer.model.content} on:action />
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		width: 100%;
	}

	.theme {
		margin-top: 1rem;
		font-weight: bold;
		font-size: 1.5rem;
		text-align: center;
	}

	.fragments {
		height: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		margin: 1rem;
		width: 100%;
	}
</style>
