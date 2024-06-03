<script lang="ts">
	import type { ViewState } from '$lib/models'
	import { scale } from 'svelte/transition'
	import { linear, quintInOut } from 'svelte/easing'
	import { tweened } from 'svelte/motion'

	export let answerAttempt: ViewState.AnswerAttempt

	const typingIndex = tweened(0, {
		duration: 500,
		easing: linear,
	})

	$: playerAnswer = answerAttempt.answer

	$: {
		$typingIndex = playerAnswer.length
	}

	$: slicedAnswer =
		$typingIndex > playerAnswer.length - 1
			? playerAnswer
			: playerAnswer.slice(0, Math.ceil($typingIndex))
</script>

{#if !answerAttempt.isMe && answerAttempt?.type === 'in-progress'}
	<div
		transition:scale={{ duration: 500, easing: quintInOut }}
		class="relative z-10 flex flex-wrap rounded-sm border border-b-2 border-text-normal bg-bg-accent p-2 text-text-accent shadow-md transition-colors duration-1000"
	>
		<div class="mr-2">
			Отвечает <strong>{answerAttempt.playerName}:</strong>
		</div>

		<div
			class="relative font-serif after:absolute after:-right-1 after:animate-blink-cursor after:content-['|']"
		>
			{slicedAnswer}
		</div>
	</div>
{/if}
