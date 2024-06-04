<script lang="ts">
	import type { ChangeEventHandler } from 'svelte/elements'
	import { createGame, uploadPack } from '$lib/pack-uploader'
	import { createEventDispatcher } from 'svelte'
	import type { SvelteCustomEvent } from '$lib/models'
	import { cn } from '$lib/style-utils'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let formLoading = false
	let hasFiles = false
	let file: File | null = null
	let message: string | null = null
	let uploadProgress: number = 0

	const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		const target = e.target as HTMLInputElement
		console.log(target.files)
		if (target?.files && target.files.length > 0) {
			file = target.files[0]
			hasFiles = true
		}
	}

	const reportUploadProgress = (progress: number) => {
		uploadProgress = progress
	}

	const handleFormSubmit = async (event: Event) => {
		event.preventDefault()
		if (!file) {
			return
		}
		try {
			formLoading = true
			const packId = await uploadPack(file, reportUploadProgress)
			console.log(`Pack uploaded, creating game`)
			const { gameCode, packName } = await createGame(packId)
			console.log(`Game created: ${gameCode} with pack ${packName}`)
			dispatch('game-created', { gameId: gameCode, packName })
		} catch (e) {
			console.error(e)
			if (e instanceof Error) {
				message = e.message
			} else {
				message = 'Smth wrong'
			}
		} finally {
			formLoading = false
		}
	}
</script>

<form
	class="mx-auto flex max-w-screen-sm flex-col items-center gap-2 rounded-sm border-2 border-b-4 border-text-normal p-4"
	on:submit={handleFormSubmit}
>
	<div
		class="relative flex w-auto -translate-y-1 select-none items-center justify-center rounded-md border-2 border-text-normal bg-bg-secondary p-2 text-center text-sm font-bold uppercase text-text-normal transition-transform ease-in-out hover:-translate-y-1.5 active:-translate-y-0.5 active:transition-all active:duration-100"
	>
		<input class="text-text" type="file" name="pack" on:change={handleInputChange} />
	</div>

	<button
		class="relative min-w-44 cursor-pointer rounded-lg border-2 border-text-normal bg-bg-secondary"
		type="submit"
		disabled={formLoading || !hasFiles}
	>
		<span
			class={cn(
				'relative -mx-0.5 flex h-full w-auto -translate-y-1 select-none items-center justify-center rounded-lg border-2 border-text-normal bg-warn px-4 py-2 text-center text-sm font-bold uppercase text-text-normal transition-transform ease-in-out',
				{
					'hover:-translate-y-1.5 active:-translate-y-0.5 active:transition-all active:duration-100':
						hasFiles,
				},
				{ 'bg-bg-main': !hasFiles }
			)}
		>
			{#if formLoading}
				{uploadProgress?.toFixed(0)}%
			{:else}
				Upload
			{/if}
		</span>
	</button>
</form>

{#if message}
	<p class="text-center text-danger">{message}</p>
{/if}
