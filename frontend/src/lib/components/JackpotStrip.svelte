<script lang="ts">
	import { scale } from 'svelte/transition'
	import { cubicInOut, quintInOut } from 'svelte/easing'
	import { tweened } from 'svelte/motion'

	export let amount: number

	const displayAmount = tweened(amount, {
		duration: 2000,
		easing: cubicInOut,
	})

	$: displayAmount.set(amount)
</script>

{#if amount > 0}
	<div
		class="jackpot-strip relative -mb-1 mt-1 overflow-hidden rounded-sm px-3 py-0.5 text-center text-xs font-bold tracking-wide"
		transition:scale={{ duration: 300, easing: quintInOut, start: 0.95 }}
	>
		<div class="jackpot-shimmer absolute inset-0" />
		<span class="relative">
			Джекпот: {Math.round($displayAmount).toLocaleString('ru-RU')}
		</span>
	</div>
{/if}

<style>
	.jackpot-strip {
		background: linear-gradient(to right, #b45309, #f59e0b, #b45309);
		border: 1px solid rgba(180, 83, 9, 0.5);
		color: #fef3c7;
	}

	.jackpot-shimmer {
		background: linear-gradient(
			110deg,
			transparent 30%,
			rgba(255, 255, 255, 0.15) 45%,
			rgba(255, 255, 255, 0.25) 50%,
			rgba(255, 255, 255, 0.15) 55%,
			transparent 70%
		);
		background-size: 250% 100%;
		animation: shimmer 4s ease-in-out infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: 200% 0;
		}
		100% {
			background-position: -200% 0;
		}
	}
</style>
