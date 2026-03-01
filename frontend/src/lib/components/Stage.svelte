<script lang="ts">
	import BeforeStart from './stages/BeforeStart.svelte'
	import Round from './stages/round/Round.svelte'
	import Question from './stages/Question.svelte'
	import PartyQuestion from './stages/PartyQuestion.svelte'
	import PartyReveal from './stages/PartyReveal.svelte'
	import AfterFinish from './stages/AfterFinish.svelte'
	import Answer from './stages/Answer.svelte'
	import type { ViewState } from '$lib/models'
	import AnswerAttempt from './AnswerAttempt.svelte'
	import AnswerAttemptEffects from './AnswerAttemptEffects.svelte'
	import ChatOverlay from './ChatOverlay.svelte'

	export let state: ViewState.View

	$: stage = state.stage
</script>

<section class="relative h-full w-full p-2">
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
	{:else if stage.type === 'party-question'}
		<PartyQuestion question={stage} on:action />
	{:else if stage.type === 'party-reveal'}
		<PartyReveal reveal={stage} on:action on:haptic />
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

		{#if state.answerAttempt.type === 'correct' || state.answerAttempt.type === 'incorrect'}
			<AnswerAttemptEffects type={state.answerAttempt.type} />
		{/if}
	{/if}

	<ChatOverlay messages={state.messages} />
</section>
