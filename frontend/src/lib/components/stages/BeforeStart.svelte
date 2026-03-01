<script lang="ts">
	import type { SvelteCustomEvent } from '$lib/models'
	import { createEventDispatcher } from 'svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { spring } from 'svelte/motion'
	import { cn } from '$lib/style-utils'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let selectedMode: 'classic' | 'party' = 'classic'
	$: isParty = selectedMode === 'party'

	const thumbX = spring(0, { stiffness: 0.3, damping: 0.7 })
	$: thumbX.set(isParty ? 1 : 0)

	const toggle = () => {
		selectedMode = isParty ? 'classic' : 'party'
		dispatch('haptic', 'medium')
	}
</script>

<section class="flex h-full items-center justify-center">
	<div
		class="flex flex-col items-center gap-5"
		transition:scale={{ duration: 300, easing: quintInOut }}
	>
		<!-- Analog toggle -->
		<button
			class="relative h-10 w-52 cursor-pointer rounded-full border-2 border-b-[3px] border-text-normal bg-bg-secondary p-0.5 active:border-b-2 active:mt-px"
			on:click={toggle}
		>
			<!-- Track labels -->
			<div class="absolute inset-0 flex select-none items-center">
				<span
					class={cn(
						'flex-1 text-center text-xs font-bold uppercase transition-opacity duration-200',
						isParty ? 'text-text-neutral opacity-100' : 'opacity-0'
					)}
				>
					Классика
				</span>
				<span
					class={cn(
						'flex-1 text-center text-xs font-bold uppercase transition-opacity duration-200',
						!isParty ? 'text-text-neutral opacity-100' : 'opacity-0'
					)}
				>
					Вечеринка
				</span>
			</div>

			<!-- Thumb -->
			<div
				class="relative h-full w-1/2 will-change-transform"
				style="transform: translateX({$thumbX * 100}%)"
			>
				<div
					class={cn(
						'h-full rounded-full border-2 border-text-normal shadow-sm transition-colors duration-200',
						isParty ? 'bg-bg-accent' : 'bg-bg-accent'
					)}
				>
					<span class="flex h-full select-none items-center justify-center text-xs font-bold uppercase text-text-accent">
						{isParty ? 'Вечеринка' : 'Классика'}
					</span>
				</div>
			</div>
		</button>

		<!-- Start button -->
		<button
			class="relative cursor-pointer rounded-lg border-2 border-text-normal bg-bg-secondary"
			on:click={() => dispatch('action', { type: 'game-start', gameMode: selectedMode })}
		>
			<span
				class="relative -mx-0.5 flex h-full w-auto -translate-y-1 select-none items-center justify-center rounded-lg border-2 border-text-normal bg-bg-accent px-4 py-2 text-center text-sm font-bold uppercase text-text-accent transition-transform ease-in-out hover:-translate-y-1.5 active:-translate-y-0.5 active:transition-all active:duration-100"
			>
				Начинаем
			</span>
		</button>
	</div>
</section>
