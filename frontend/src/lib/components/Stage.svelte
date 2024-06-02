<script lang="ts">
	import BeforeStart from './stages/BeforeStart.svelte'
	import Round from './stages/round/Round.svelte'
	import Question from './stages/Question.svelte'
	import AfterFinish from './stages/AfterFinish.svelte'
	import Answer from './stages/Answer.svelte'
	import type { ViewState } from '$lib/models'
	import AnswerAttempt from './AnswerAttempt.svelte'
	import AnswerAttemptEffects from './AnswerAttemptEffects.svelte'
	import ChatOverlay from './ChatOverlay.svelte'
	import ReactionDragger from './ReactionDragger.svelte'

	export let state: ViewState.View

	let reactionDragger: ReactionDragger | undefined = undefined

	function nearStageBottom(y: number) {
		const stageBottom = window.innerHeight - 150
		return y > stageBottom
	}

	const handleMouseDown = (e: MouseEvent) => {
		if (nearStageBottom(e.clientY)) {
			reactionDragger?.handleMouseDown(e)
		}
	}

	const handleTouchStart = (e: TouchEvent) => {
		if (nearStageBottom(e.touches[0].clientY)) {
			reactionDragger?.handleTouchStart(e)
		}
	}

	$: stage = state.stage
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
	class="relative h-full w-full p-2"
	on:mousedown={handleMouseDown}
	on:touchstart={handleTouchStart}
>
	{#if stage.type === 'before-start'}
		<BeforeStart on:action />
	{:else if stage.type === 'connecting'}
		<section class="flex h-full items-center justify-center">
			<div class="animate-bounce text-xl">Connecting...</div>
		</section>
	{:else if stage.type === 'round'}
		<Round round={stage} on:action />
	{:else if stage.type === 'question'}
		<Question question={stage} on:action />
	{:else if stage.type === 'answer'}
		<Answer answer={stage} on:action />
	{:else if stage.type === 'after-finish'}
		<AfterFinish players={state.players} />
	{:else}
		<p>Unknown stage</p>
		<pre>{JSON.stringify(stage, null, 2)}</pre>
	{/if}

	{#if state.answerAttempt}
		<div class="absolute bottom-0 left-0 w-full p-2">
			<AnswerAttempt answerAttempt={state.answerAttempt} />
		</div>

		{#if state.answerAttempt.type !== 'in-progress'}
			<AnswerAttemptEffects type={state.answerAttempt.type} />
		{/if}
	{/if}

	<ReactionDragger on:action on:haptic bind:this={reactionDragger} />

	<ChatOverlay messages={state.messages} />
</section>
