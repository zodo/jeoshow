<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import type { SibrowserPack, SibrowserListing } from '$lib/sibrowser-types'
	import type { SvelteCustomEvent } from '$lib/models'
	import { cn } from '$lib/style-utils'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let packs: SibrowserPack[] = []
	let loading = true
	let error: string | null = null
	let creatingGameForId: string | null = null

	onMount(async () => {
		try {
			const res = await fetch('/api/sibrowser/packs')
			if (!res.ok) throw new Error('Failed to load')
			const data: SibrowserListing = await res.json()
			packs = data.packs
		} catch {
			error = 'Не удалось загрузить список паков'
		} finally {
			loading = false
		}
	})

	const handleSelectPack = async (pack: SibrowserPack) => {
		if (creatingGameForId) return
		creatingGameForId = pack.id
		error = null
		try {
			const res = await fetch(`/api/sibrowser/packs/${pack.id}/create-game`, {
				method: 'POST',
			})
			const data = (await res.json()) as { gameCode?: string; packName?: string; error?: string }
			if (data.gameCode) {
				dispatch('game-created', { gameId: data.gameCode, packName: data.packName ?? '' })
			} else {
				error = data.error ?? 'Не удалось создать игру'
			}
		} catch {
			error = 'Не удалось создать игру'
		} finally {
			creatingGameForId = null
		}
	}

	const formatDownloads = (n: number): string => {
		if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
		return n.toString()
	}
</script>

{#if loading}
	<p class="text-center text-text-neutral text-sm">Загрузка...</p>
{:else if packs.length === 0 && error}
	<p class="text-center text-danger text-sm">{error}</p>
{:else}
	<div class="flex flex-col gap-3">
		{#each packs as pack (pack.id)}
			<div
				class={cn(
					'w-full rounded-sm border-2 border-b-4 border-text-normal bg-bg-secondary p-3',
					{ 'opacity-50': creatingGameForId && creatingGameForId !== pack.id }
				)}
			>
				<div class="flex items-start gap-3">
					<div class="min-w-0 flex-1">
						<div class="font-bold text-text-normal text-sm leading-tight">
							{pack.title}
						</div>
						<div class="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-neutral">
							<span>{pack.author}</span>
							<span>·</span>
							<span>{pack.fileSize}</span>
							<span>·</span>
							<span>↓ {formatDownloads(pack.downloadCount)}</span>
						</div>
						{#if pack.tags.length > 0}
							<div class="mt-1.5 flex flex-wrap gap-1">
								{#each pack.tags.slice(0, 4) as tag}
									<span class="rounded bg-bg-main px-1.5 py-0.5 text-xs text-text-neutral">
										{tag}
									</span>
								{/each}
							</div>
						{/if}
						{#if pack.description}
							<p class="mt-1.5 text-xs text-text-neutral">
								{pack.description}
							</p>
						{/if}
						{#if pack.rounds && pack.rounds.length > 0}
							<details class="mt-1.5">
								<summary class="text-xs text-text-neutral cursor-pointer">
									Темы ({pack.rounds.length} раундов)
								</summary>
								<div class="mt-1 text-xs text-text-neutral">
									{#each pack.rounds as round}
										<p class="mt-0.5">
											<span class="font-bold">{round.name}:</span>
											{round.themes}
										</p>
									{/each}
								</div>
							</details>
						{/if}
					</div>
					<button
						class={cn(
							'shrink-0 self-center cursor-pointer rounded-lg border-2 border-text-normal bg-warn px-3 py-1.5 text-xs font-bold uppercase text-text-normal transition-transform ease-in-out',
							{
								'hover:-translate-y-0.5 active:translate-y-0.5': !creatingGameForId,
							}
						)}
						on:click={() => handleSelectPack(pack)}
						disabled={!!creatingGameForId}
					>
						{#if creatingGameForId === pack.id}
							<span class="inline-flex gap-0.5">
								<span class="animate-bounce">.</span>
								<span class="animate-bounce [animation-delay:0.15s]">.</span>
								<span class="animate-bounce [animation-delay:0.3s]">.</span>
							</span>
						{:else}
							Играть
						{/if}
					</button>
				</div>
			</div>
		{/each}
	</div>

	{#if error}
		<p class="mt-2 text-center text-danger text-sm">{error}</p>
	{/if}
{/if}
