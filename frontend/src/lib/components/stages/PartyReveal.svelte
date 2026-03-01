<script lang="ts">
	import type { ViewState } from '$lib/models'
	import type { HapticType } from '$lib/models'
	import type { ClientAction } from 'shared/models/messages'
	import { createEventDispatcher, onMount } from 'svelte'
	import { tweened } from 'svelte/motion'
	import { cubicOut, cubicInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'
	import Confetti from 'svelte-confetti'

	const dispatch = createEventDispatcher<{ haptic: HapticType; action: ClientAction }>()

	export let reveal: ViewState.PartyRevealStage

	type BankPhase = 'price-enter' | 'jackpot-merge' | 'float-up' | 'settled' | 'verdicts'
	let bankPhase: BankPhase = 'price-enter'

	const hasJackpot = reveal.jackpot > 0
	const bankDisplay = tweened(0, { duration: 600, easing: cubicOut })
	const jackpotDisplay = tweened(reveal.jackpot, { duration: 600, easing: cubicInOut })

	let jackpotVisible = false
	let priceVisible = false

	let verdictsReady = false
	$: if (!reveal.loading && reveal.verdicts.length > 0) {
		verdictsReady = true
	}

	// Sort: passes → wrongs → wins
	$: sortedVerdicts = [...reveal.verdicts].sort((a, b) => {
		const rank = (v: ViewState.PartyRevealVerdict) =>
			v.passed ? 0 : !v.correct ? 1 : 2
		return rank(a) - rank(b)
	})

	// Per-card reveal step:
	// -1 = hidden, 0 = card shell, 1 = avatar, 2 = name+answer, 3 = x2, 4 = bg color
	let cardSteps: number[] = []
	let showConfetti = false
	let scoresVisible = false

	let revealStarted = false

	onMount(() => {
		runAnimation()
	})

	async function runAnimation() {
		bankPhase = 'price-enter'
		priceVisible = true
		await bankDisplay.set(reveal.price)
		await delay(200)

		if (hasJackpot) {
			bankPhase = 'jackpot-merge'
			jackpotVisible = true
			await delay(400)
			await Promise.all([
				bankDisplay.set(reveal.totalPot, { duration: 800, easing: cubicInOut }),
				jackpotDisplay.set(0, { duration: 800, easing: cubicInOut }),
			])
			jackpotVisible = false
			await delay(200)
		}

		bankPhase = 'float-up'
		await delay(500)
		bankPhase = 'settled'

		if (verdictsReady && !revealStarted) {
			revealStarted = true
			await delay(300)
			bankPhase = 'verdicts'
			await revealVerdicts()
		}
	}

	$: if (bankPhase === 'settled' && verdictsReady && !revealStarted) {
		revealStarted = true
		delay(300).then(() => {
			bankPhase = 'verdicts'
			dispatch('haptic', 'medium')
			revealVerdicts()
		})
	}

	function setStep(i: number, step: number) {
		cardSteps[i] = step
		cardSteps = cardSteps
	}

	async function revealVerdicts() {
		cardSteps = sortedVerdicts.map(() => -1)
		scoresVisible = false

		for (let i = 0; i < sortedVerdicts.length; i++) {
			const v = sortedVerdicts[i]
			const isPassed = v.passed
			const isCorrect = v.correct

			// Gap before card (except first)
			if (i > 0) {
				const gap = isPassed ? 200 : 700
				await delay(gap)
			}

			if (isPassed) {
				// Passes: card + avatar + name, then dim
				setStep(i, 3)
				await delay(250)
				setStep(i, 4)
			} else {
				// Step 0: card shell
				setStep(i, 0)
				await delay(150)

				// Step 1: avatar
				setStep(i, 1)
				await delay(200)

				// Step 2: name + answer
				setStep(i, 2)
				await delay(400)

				// Step 3: x2 badge
				setStep(i, 3)
				await delay(v.confidenceBet ? 600 : 400)

				// Step 4: bg color (the reveal)
				setStep(i, 4)
				if (isCorrect) dispatch('haptic', 'success')
				else dispatch('haptic', 'warning')
				if (isCorrect) {
					showConfetti = false
					await delay(0)
					showConfetti = true
				}
			}
		}

		// Show scores on all cards at once
		await delay(800)
		scoresVisible = true
		dispatch('haptic', 'medium')

		await delay(3000)
		dispatch('action', { type: 'party-reveal-ready' })
	}

	function delay(ms: number): Promise<void> {
		return new Promise((r) => setTimeout(r, ms))
	}

	function formatNumber(n: number): string {
		return Math.round(n).toLocaleString('ru-RU')
	}

	function avatarColors(name: string): [string, string] {
		const colors: [string, string][] = [
			['bg-red-300', 'text-red-950'],
			['bg-yellow-300', 'text-yellow-950'],
			['bg-green-300', 'text-green-950'],
			['bg-blue-300', 'text-blue-950'],
			['bg-indigo-300', 'text-indigo-950'],
			['bg-purple-300', 'text-purple-950'],
			['bg-pink-300', 'text-pink-950'],
		]
		const sum = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
		return colors[sum % colors.length]
	}
</script>

<section class="relative flex h-full flex-col items-center overflow-hidden">
	<!-- Bank number -->
	<div
		class="bank-container absolute left-0 right-0 flex flex-col items-center justify-center transition-all duration-500 ease-out"
		class:bank-center={bankPhase === 'price-enter' || bankPhase === 'jackpot-merge'}
		class:bank-top={bankPhase === 'float-up' || bankPhase === 'settled' || bankPhase === 'verdicts'}
	>
		{#if priceVisible}
			<div
				class="bank-value select-none text-center"
				class:bank-value-large={bankPhase === 'price-enter' || bankPhase === 'jackpot-merge'}
				class:bank-value-settled={bankPhase === 'float-up' || bankPhase === 'settled' || bankPhase === 'verdicts'}
			>
				<div class="bank-label text-xs font-semibold uppercase tracking-widest text-text-neutral">
					Банк
				</div>
				<div class="bank-number font-bold tabular-nums text-text-normal">
					{formatNumber($bankDisplay)}
				</div>
			</div>
		{/if}

		{#if jackpotVisible}
			<div class="jackpot-merge-value mt-2 text-center">
				<div class="text-xs font-semibold uppercase tracking-wide text-text-neutral">
					Джекпот
				</div>
				<div class="text-2xl font-bold tabular-nums text-text-normal">
					+{formatNumber($jackpotDisplay)}
				</div>
			</div>
		{/if}
	</div>

	<!-- Verdicts -->
	{#if bankPhase === 'verdicts'}
		<div class="mt-12 flex w-full min-h-0 flex-1 flex-col px-4">
			<!-- Card list -->
			<div class="min-h-0 flex-1 space-y-2 overflow-auto py-1">
				{#each [...sortedVerdicts].reverse() as v, ri}
					{@const i = sortedVerdicts.length - 1 - ri}
					{@const step = cardSteps[i] ?? -1}
					{#if step >= 0}
						{@const [bgCol, txtCol] = avatarColors(v.playerName)}
						<div
							class={cn(
								'verdict-card flex items-center gap-2.5 rounded-lg px-3 py-2 transition-all duration-[800ms]',
								step >= 4 && v.correct && 'verdict-correct',
								step >= 4 && !v.correct && !v.passed && 'verdict-wrong',
								step >= 4 && v.passed && 'verdict-pass',
								step < 4 && 'bg-bg-main'
							)}
						>
							<!-- Avatar -->
							<div
								class="flex-none transition-opacity duration-150"
								class:opacity-0={step < 1}
							>
								{#if v.avatarUrl}
									<img src={v.avatarUrl} alt="" class="h-9 w-9 rounded-full" />
								{:else}
									<div
										class={cn(
											'flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold',
											bgCol,
											txtCol
										)}
									>
										{v.playerName[0]?.toUpperCase() ?? '?'}
									</div>
								{/if}
							</div>

							<!-- Name + answer -->
							<div
								class="min-w-0 flex-1 transition-opacity duration-150"
								class:opacity-0={step < 2}
							>
								<div class="text-xs opacity-70">{v.playerName}</div>
								{#if !v.passed}
									<div class="text-sm font-serif font-bold leading-tight break-words">{v.answer}</div>
								{/if}
							</div>

							<!-- Right slot: ПАС / x2 → score -->
							<div class="flex w-10 flex-none items-center justify-end">
								{#if v.passed && step >= 3}
									<span class="text-xs font-bold opacity-60">ПАС</span>
								{:else if scoresVisible}
									<span class="score-reveal text-sm font-black tabular-nums">
										{(v.scoreDiff > 0 ? '+' : '') + v.scoreDiff}
									</span>
								{:else if v.confidenceBet && step >= 3}
									<div
										class="bet-badge flex h-7 w-7 items-center justify-center rounded-full border-2 border-current text-[10px] font-black"
									>
										x2
									</div>
								{/if}
							</div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	{/if}

	<!-- Confetti cannons aimed at winner -->
	{#if showConfetti}
		<div class="pointer-events-none absolute bottom-0 left-0 h-2 w-1">
			<Confetti x={[0.3, 1.5]} y={[0.8, 2]} cone delay={[0, 100]} amount={35} fallDistance="120px" duration={2500} />
		</div>
		<div class="pointer-events-none absolute bottom-0 right-0 h-2 w-1">
			<Confetti x={[-1.5, -0.3]} y={[0.8, 2]} cone delay={[50, 150]} amount={35} fallDistance="120px" duration={2500} />
		</div>
	{/if}

	<!-- Waiting dots while LLM checks -->
	{#if bankPhase === 'settled' && !verdictsReady}
		<div class="absolute inset-0 flex items-center justify-center pt-20">
			<div class="flex gap-1.5">
				<span class="dot" />
				<span class="dot" style="animation-delay: 0.15s" />
				<span class="dot" style="animation-delay: 0.3s" />
			</div>
		</div>
	{/if}
</section>

<style>
	.bank-container {
		z-index: 10;
	}

	.bank-center {
		top: 50%;
		transform: translateY(-50%);
	}

	.bank-top {
		top: 0;
		transform: translateY(0);
		padding-top: 0.5rem;
	}

	.bank-value {
		transition: all 0.5s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.bank-value-large .bank-label {
		font-size: 0.875rem;
		margin-bottom: 0.125rem;
	}

	.bank-value-large .bank-number {
		font-size: 3rem;
		line-height: 1;
		letter-spacing: -0.02em;
	}

	.bank-value-settled .bank-label {
		font-size: 0.625rem;
		margin-bottom: 0;
	}

	.bank-value-settled .bank-number {
		font-size: 1.25rem;
		line-height: 1.2;
	}

	.jackpot-merge-value {
		animation: fade-up 0.3s ease-out;
	}

	.verdict-card {
		animation: card-enter 0.5s cubic-bezier(0.18, 1.8, 0.58, 1) both;
		margin-left: 6px;
		margin-right: 6px;
	}

	.verdict-correct {
		background: #059669;
		color: #fff;
	}

	.verdict-wrong {
		background: #e11d48;
		color: #fff;
	}

	.verdict-pass {
		background: var(--color-bg-main);
		opacity: 0.5;
	}

	.bet-badge {
		animation: badge-pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	.score-reveal {
		animation: score-pop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	.dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--color-text-neutral);
		animation: dot-pulse 1s ease-in-out infinite;
	}

	@keyframes fade-up {
		from {
			opacity: 0;
			transform: translateY(8px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes card-enter {
		from {
			opacity: 0;
			transform: scale(0.8);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes badge-pop {
		from {
			transform: scale(0);
		}
		to {
			transform: scale(1);
		}
	}

	@keyframes score-pop {
		from {
			opacity: 0;
			transform: scale(0.5);
		}
		to {
			opacity: 1;
			transform: scale(1);
		}
	}

	@keyframes dot-pulse {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}
</style>
