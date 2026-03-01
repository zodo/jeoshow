<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale, fly } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { spring } from 'svelte/motion'
	import { cn } from '$lib/style-utils'

	export let playerCount: number = 0

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let selectedMode: 'classic' | 'party' = 'party'
	$: isParty = selectedMode === 'party'

	const thumbX = spring(0, { stiffness: 0.3, damping: 0.7 })
	$: thumbX.set(isParty ? 0 : 1)

	const toggle = () => {
		selectedMode = isParty ? 'classic' : 'party'
		dispatch('haptic', 'medium')
	}

	const modes = {
		party: { label: 'Вечеринка', desc: 'Все отвечают одновременно' },
		classic: { label: 'Классика', desc: 'Отвечает самый быстрый нажиматель на кнопку' },
	}
</script>

<section class="flex h-full items-center justify-center">
	<div
		class="flex w-full max-w-64 flex-col items-center"
		transition:scale={{ duration: 300, easing: quintInOut }}
	>
		<!-- Mode title -->
		{#key selectedMode}
			<h1
				class="font-serif text-3xl font-bold tracking-tight"
				in:fly={{ y: -10, duration: 250, easing: quintInOut }}
			>
				{modes[selectedMode].label}
			</h1>
		{/key}

		<!-- Mode description -->
		{#key selectedMode}
			<p
				class="mt-1.5 min-h-[2.5rem] text-center font-serif text-sm leading-snug text-text-neutral"
				in:fly={{ y: 6, duration: 250, delay: 50, easing: quintInOut }}
			>
				{modes[selectedMode].desc}
			</p>
		{/key}

		<!-- Toggle -->
		<button
			class="mt-4 relative h-9 w-48 cursor-pointer rounded-full border-2 border-b-[3px] border-text-normal bg-bg-secondary p-0.5 active:mt-[calc(1rem+1px)] active:border-b-2"
			on:click={toggle}
		>
			<div class="absolute inset-0 flex select-none items-center">
				<span
					class={cn(
						'flex-1 text-center text-[11px] font-bold uppercase tracking-wider transition-opacity duration-200',
						!isParty ? 'text-text-neutral opacity-100' : 'opacity-0'
					)}
				>
					Вечеринка
				</span>
				<span
					class={cn(
						'flex-1 text-center text-[11px] font-bold uppercase tracking-wider transition-opacity duration-200',
						isParty ? 'text-text-neutral opacity-100' : 'opacity-0'
					)}
				>
					Классика
				</span>
			</div>

			<div
				class="relative h-full w-1/2 will-change-transform"
				style="transform: translateX({$thumbX * 100}%)"
			>
				<div
					class="h-full rounded-full border-2 border-text-normal bg-bg-accent shadow-sm transition-colors duration-200"
				>
					<span
						class="flex h-full select-none items-center justify-center text-[11px] font-bold uppercase tracking-wider text-text-accent"
					>
						{isParty ? 'Вечеринка' : 'Классика'}
					</span>
				</div>
			</div>
		</button>

		<!-- Divider -->
		<div class="mt-6 mb-5 h-px w-16 bg-text-neutral/30"></div>

		<!-- Player count -->
		<p class="text-xs uppercase tracking-widest text-text-neutral">
			{playerCount}
			{#if playerCount === 1}игрок{:else if playerCount >= 2 && playerCount <= 4}игрока{:else}игроков{/if}
			в лобби
		</p>
		<p class="mt-1 text-[11px] text-text-neutral/70">
			Дождитесь всех игроков
		</p>

		<!-- Start button -->
		<button
			class="relative mt-5 cursor-pointer rounded-lg border-2 border-text-normal bg-bg-secondary"
			on:click={() => dispatch('action', { type: 'game-start', gameMode: selectedMode })}
		>
			<span
				class="relative -mx-0.5 flex h-full w-auto -translate-y-1 select-none items-center justify-center rounded-lg border-2 border-text-normal bg-bg-accent px-8 py-2.5 text-center text-sm font-bold uppercase tracking-wider text-text-accent transition-transform ease-in-out hover:-translate-y-1.5 active:-translate-y-0.5 active:transition-all active:duration-100"
			>
				Начинаем
			</span>
		</button>
	</div>
</section>
