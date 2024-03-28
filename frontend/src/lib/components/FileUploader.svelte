<script lang="ts">
	import type { ChangeEventHandler, EventHandler } from 'svelte/elements'
	import { goto } from '$app/navigation'
	import { createGame, uploadPack } from '$lib/pack-uploader'

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
			goto(`/game/${gameId}`)
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

<form on:submit={handleFormSubmit} class="medium-shadow-filter">
	<input id="pack" type="file" name="pack" on:change={handleInputChange} />
	<button type="submit" disabled={formLoading || !hasFiles}>
		{#if formLoading}
			{uploadProgress?.toFixed(0)}%
		{:else}
			Upload
		{/if}
	</button>
</form>

{#if message}
	<p>{message}</p>
{/if}

<style>
	form {
		max-width: 100%;
		display: flex;
	}

	button {
		margin: 0;
		padding: 1rem;
		border: none;
		border-radius: 0 1rem 1rem 0;
		background-color: var(--color-accent);
		font-size: 1rem;
		transition: background-color 0.8s;
		cursor: pointer;
		min-width: 5rem;
	}

	button:hover {
		background-color: var(--color-accent-dark);
	}

	input {
		height: 3.5rem;
		font-size: 1rem;
		margin: 0;
		padding: 1rem;
		border: none;
		border-radius: 1rem 0 0 1rem; /* Opposite of the button to fit together */
		background-color: var(--color-neutral);
		cursor: pointer;
		display: inline-block; /* Or use flex for better control */
		transition: background-color 0.8s;
		flex: 0 1 auto;
	}

	input:hover {
		background-color: var(--color-accent-dark);
	}

	p {
		text-align: center;
		color: var(--color-danger);
	}
</style>
