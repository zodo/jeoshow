<script lang="ts">
	import Progress from '../Progress.svelte'
	import MediaFragment from '../MediaFragment.svelte'
	import type { ViewState } from '$lib/models'
	import { linear, quintInOut } from 'svelte/easing'
	import { tweened } from 'svelte/motion'
	import { scale, slide } from 'svelte/transition'
	import { Confetti } from 'svelte-confetti'

	export let question: ViewState.QuestionStage

	const typingIndex = tweened(0, {
		duration: 500,
		easing: linear,
	})

	$: playerAnswer = question.awaitingAnswer ? question.awaitingAnswer.answer : ''

	$: {
		$typingIndex = playerAnswer.length
	}

	$: slicedAnswer =
		$typingIndex > playerAnswer.length - 1
			? playerAnswer
			: playerAnswer.slice(0, Math.ceil($typingIndex))

	$: timeoutSeconds = question.readyForHit
		? question.readyForHit.timeoutSeconds
		: question.awaitingAnswer &&
			  question.awaitingAnswer.isMe &&
			  question.awaitingAnswer.type === 'in-progress'
			? question.awaitingAnswer.timeoutSeconds
			: undefined

	$: showAnswerPopup =
		question.awaitingAnswer?.type === 'correct' ||
		question.awaitingAnswer?.type === 'incorrect' ||
		(question.awaitingAnswer && !question.awaitingAnswer.isMe)
</script>

<section class="relative grid h-full grid-rows-[min-content_1fr_min-content] gap-2">
	<div class="text-center">
		<div class="text-xl font-bold">{question.theme}</div>
		{#if question.themeComment}
			<div class="mt-1 text-sm italic">{question.themeComment}</div>
		{/if}
	</div>

	<div class="overflow-scroll">
		<MediaFragment fragments={question.fragments} on:action />
	</div>

	{#if showAnswerPopup}
		<div
			transition:slide={{ duration: 500, easing: quintInOut }}
			class="relative z-10 flex max-w-full flex-wrap rounded-2xl bg-bg-accent p-2 text-text-accent shadow-md"
		>
			{#if question.awaitingAnswer?.type === 'in-progress'}
				<div class="mr-2">
					Отвечает <strong>{question.awaitingAnswer.playerName}:</strong>
				</div>

				<div
					class="relative font-serif after:absolute after:-right-1 after:animate-blink-cursor after:content-['|']"
				>
					{slicedAnswer}
				</div>
			{/if}

			{#if question.awaitingAnswer?.type === 'correct'}
				<div
					in:scale={{ duration: 500, easing: quintInOut }}
					class="relative w-full text-center font-serif font-bold"
				>
					{#if question.awaitingAnswer.isMe}
						Верно!
					{:else}
						{playerAnswer}
					{/if}
				</div>
			{/if}

			{#if question.awaitingAnswer?.type === 'incorrect'}
				<div
					in:scale={{ duration: 500, easing: quintInOut }}
					class="relative w-full text-center font-serif font-bold"
				>
					{#if question.awaitingAnswer.isMe}
						Неправильно!
					{:else}
						{playerAnswer}
					{/if}
				</div>
			{/if}
		</div>
	{/if}

	{#if question.awaitingAnswer}
		{#if question.awaitingAnswer?.type === 'correct'}
			<div class="absolute bottom-0 left-0 h-2 w-1">
				<Confetti x={[0, 2]} y={[0, 2]} cone delay={[0, 50]} />
			</div>
			<div class="absolute bottom-0 right-0 h-2 w-1">
				<Confetti x={[-2, 0]} y={[0, 2]} cone delay={[250, 300]} />
			</div>
		{/if}
		{#if question.awaitingAnswer?.type === 'incorrect'}
			<div class="absolute bottom-0 left-0 h-2 w-1">
				<Confetti
					x={[0, 2]}
					y={[0, 2]}
					cone
					delay={[0, 500]}
					colorArray={['url(/poop.png)']}
					size={20}
				/>
			</div>
			<div class="absolute bottom-0 right-0 h-2 w-1">
				<Confetti
					x={[-2, 0]}
					y={[0, 2]}
					cone
					delay={[0, 500]}
					colorArray={['url(/poop.png)']}
					size={20}
				/>
			</div>
		{/if}
	{/if}

	{#if timeoutSeconds}
		{#key !!question.readyForHit}
			<div class="h-4 w-full">
				<Progress seconds={timeoutSeconds} />
			</div>
		{/key}
	{/if}
</section>
