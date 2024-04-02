<script lang="ts">
	import type { ChangeEventHandler } from 'svelte/elements'
	import { createGame, uploadPack } from '$lib/pack-uploader'
	import { createEventDispatcher } from 'svelte'
	import type { SvelteCustomEvent } from '$lib/models'

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
			const gameId = await createGame(packId)
			console.log(`Game created: ${gameId}`)
			dispatch('game-created', { gameId })
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

<form class="flex max-w-full drop-shadow-md" on:submit={handleFormSubmit}>
	<input
		class="inline-block h-14 flex-1 rounded-l-2xl bg-bg-secondary p-4 transition-colors"
		id="pack"
		type="file"
		name="pack"
		on:change={handleInputChange}
	/>
	<button
		class="min-w-20 rounded-r-2xl bg-bg-accent p-4 text-text-accent transition-colors"
		type="submit"
		disabled={formLoading || !hasFiles}
	>
		{#if formLoading}
			{uploadProgress?.toFixed(0)}%
		{:else}
			Upload
		{/if}
	</button>
</form>

{#if message}
	<p class="text-center text-danger">{message}</p>
{/if}
