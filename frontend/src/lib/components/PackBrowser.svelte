<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte'
	import type { SibrowserPack, SibrowserPacksResponse, DownloadedPack } from '$lib/sibrowser-types'
	import type { SvelteCustomEvent } from '$lib/models'
	import { cn } from '$lib/style-utils'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let packs: SibrowserPack[] = []
	let fallbackPacks: DownloadedPack[] = []
	let downloadedIds: Set<string> = new Set()
	let loading = true
	let error: string | null = null
	let creatingGameForId: string | null = null
	let progressMessage: string | null = null

	$: isFallback = packs.length === 0 && fallbackPacks.length > 0

	onMount(async () => {
		try {
			const res = await fetch('/api/sibrowser/packs')
			if (!res.ok) throw new Error('Failed to load')
			const data: SibrowserPacksResponse = await res.json()
			packs = data.packs
			downloadedIds = new Set(data.downloadedPackIds ?? [])
			if (data.fallbackPacks) fallbackPacks = data.fallbackPacks
		} catch {
			error = 'Не удалось загрузить список паков'
		} finally {
			loading = false
		}
	})

	const packMetadataBody = (pack: SibrowserPack | DownloadedPack) =>
		JSON.stringify({
			title: pack.title,
			author: pack.author,
			fileSize: pack.fileSize,
			tags: pack.tags,
			description: pack.description,
			rounds: pack.rounds,
		})

	const handleSelectPack = async (packId: string, pack: SibrowserPack | DownloadedPack) => {
		if (creatingGameForId) return
		creatingGameForId = packId
		error = null
		progressMessage = null
		try {
			const res = await fetch(`/api/sibrowser/packs/${packId}/create-game`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: packMetadataBody(pack),
			})

			// Fast path: JSON response (cached pack)
			const ct = res.headers.get('content-type') ?? ''
			if (ct.includes('application/json')) {
				const data = (await res.json()) as {
					gameCode?: string
					packName?: string
					error?: string
				}
				if (data.gameCode) {
					dispatch('game-created', { gameId: data.gameCode, packName: data.packName ?? '' })
				} else {
					error = data.error ?? 'Не удалось создать игру'
				}
				return
			}

			// Slow path: SSE stream
			const reader = res.body?.getReader()
			if (!reader) {
				error = 'Не удалось создать игру'
				return
			}

			const decoder = new TextDecoder()
			let buffer = ''

			while (true) {
				const { done, value } = await reader.read()
				if (done) break
				buffer += decoder.decode(value, { stream: true })

				const parts = buffer.split('\n\n')
				buffer = parts.pop() ?? ''

				for (const part of parts) {
					const eventMatch = part.match(/^event: (\w+)\ndata: (.+)$/s)
					if (!eventMatch) continue
					const [, event, data] = eventMatch

					if (event === 'progress') {
						progressMessage = data
					} else if (event === 'done') {
						const result = JSON.parse(data) as { gameCode: string; packName: string }
						dispatch('game-created', {
							gameId: result.gameCode,
							packName: result.packName ?? '',
						})
						return
					} else if (event === 'error') {
						error = data
						return
					}
				}
			}
		} catch {
			error = 'Не удалось создать игру'
		} finally {
			creatingGameForId = null
			progressMessage = null
		}
	}

	const formatDownloads = (n: number): string => {
		if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
		return n.toString()
	}
</script>

{#if loading}
	<p class="text-center text-text-neutral text-sm">Загрузка...</p>
{:else if packs.length === 0 && fallbackPacks.length === 0 && error}
	<p class="text-center text-danger text-sm">{error}</p>
{:else}
	<div class="flex flex-col gap-3">
		{#if isFallback}
			{#each fallbackPacks as pack (pack.sibrowserId)}
				{@const packId = pack.sibrowserId}
				<div
					class={cn(
						'w-full rounded-sm border-2 border-b-4 border-text-normal bg-bg-secondary p-3',
						{ 'opacity-50': creatingGameForId && creatingGameForId !== packId }
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
						<div class="shrink-0 self-center flex flex-col items-center gap-1">
							<button
								class={cn(
									'cursor-pointer rounded-lg border-2 border-text-normal bg-warn px-3 py-1.5 text-xs font-bold uppercase text-text-normal transition-transform ease-in-out',
									{
										'hover:-translate-y-0.5 active:translate-y-0.5': !creatingGameForId,
									}
								)}
								on:click={() => handleSelectPack(packId, pack)}
								disabled={!!creatingGameForId}
							>
								{#if creatingGameForId === packId}
									<span class="inline-flex gap-0.5">
										<span class="animate-bounce">.</span>
										<span class="animate-bounce [animation-delay:0.15s]">.</span>
										<span class="animate-bounce [animation-delay:0.3s]">.</span>
									</span>
								{:else}
									Играть
								{/if}
							</button>
							{#if creatingGameForId === packId && progressMessage}
								<span class="text-[10px] text-text-neutral whitespace-nowrap">
									{progressMessage}
								</span>
							{/if}
						</div>
					</div>
					{#if creatingGameForId === packId && error}
						<p class="mt-2 text-center text-danger text-xs">{error}</p>
					{/if}
				</div>
			{/each}
		{:else}
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
						<div class="shrink-0 self-center flex flex-col items-center gap-1">
							<button
								class={cn(
									'cursor-pointer rounded-lg border-2 border-text-normal bg-warn px-3 py-1.5 text-xs font-bold uppercase text-text-normal transition-transform ease-in-out',
									{
										'hover:-translate-y-0.5 active:translate-y-0.5': !creatingGameForId,
									}
								)}
								on:click={() => handleSelectPack(pack.id, pack)}
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
							{#if creatingGameForId === pack.id && progressMessage}
								<span class="text-[10px] text-text-neutral whitespace-nowrap">
									{progressMessage}
								</span>
							{/if}
						</div>
					</div>
					{#if creatingGameForId === pack.id && error}
						<p class="mt-2 text-center text-danger text-xs">{error}</p>
					{/if}
				</div>
			{/each}
		{/if}
	</div>

	{#if error && !creatingGameForId}
		<p class="mt-2 text-center text-danger text-sm">{error}</p>
	{/if}
{/if}
