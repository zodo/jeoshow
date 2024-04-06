<script lang="ts">
	import type { ViewState } from '$lib/models'
	import { scale } from 'svelte/transition'
	import { cn } from '$lib/style-utils'
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

{#if !answerAttempt.isMe}
	<div
		transition:scale={{ duration: 500, easing: quintInOut }}
		class={cn(
			'relative z-10 flex flex-wrap rounded-md bg-bg-accent p-2 text-text-accent shadow-md transition-colors duration-1000',
			answerAttempt?.type === 'correct' && 'bg-green-600',
			answerAttempt?.type === 'incorrect' && 'bg-danger'
		)}
	>
		{#if answerAttempt?.type === 'in-progress'}
			<div class="mr-2">
				Отвечает <strong>{answerAttempt.playerName}:</strong>
			</div>

			<div
				class="relative font-serif after:absolute after:-right-1 after:animate-blink-cursor after:content-['|']"
			>
				{slicedAnswer}
			</div>
		{/if}

		{#if answerAttempt?.type === 'correct' || answerAttempt?.type === 'incorrect'}
			<div in:scale={{ duration: 500, easing: quintInOut }} class="w-full text-center">
				{playerAnswer}
			</div>
		{/if}
	</div>
{/if}
