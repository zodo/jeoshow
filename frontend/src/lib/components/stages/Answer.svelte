<script lang="ts">
	import type { StageSnapshot } from 'shared/models/models'
	import MediaFragment from '../MediaFragment.svelte'

	export let answer: Extract<StageSnapshot, { type: 'answer' }>
</script>

<section>
	<div class="theme">{answer.theme}</div>

	<div class="fragments">
		<MediaFragment fragments={answer.model.content} on:action />
	</div>
</section>

<style>
	section {
		display: grid;
		grid-template-rows: min-content 1fr;
		height: 100%;
	}

	.theme {
		font-weight: bold;
		font-size: 1.5rem;
		text-align: center;
	}

	.fragments {
		overflow: scroll;
	}
</style>
