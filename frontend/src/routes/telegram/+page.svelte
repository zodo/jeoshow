<script lang="ts">
	import { getWebapp } from '$lib/tg-webapp-context'
	import { onMount } from 'svelte'
	import type { ChangeEventHandler } from 'svelte/elements'
	import { createGame, uploadPack } from '$lib/pack-uploader'

	const webApp = getWebapp()

	let gameLink = ''

	const handleFileUpload = async () => {
		if (!file) {
			return
		}
		try {
			$webApp.MainButton.showProgress(false)
			const packId = await uploadPack(file)
			console.log(`Pack uploaded, creating game`)
			const gameId = await createGame(packId)
			console.log(`Game created: ${gameId}`)
			gameLink = `https://jeoshow.220400.xyz/game/${gameId}`
		} catch (e) {
			console.error(e)
			if (e instanceof Error) {
				message = e.message
			} else {
				message = 'Smth wrong'
			}
		} finally {
			$webApp.MainButton.hideProgress()
			$webApp.MainButton.hide()
		}
	}

	onMount(() => {
		$webApp.MainButton.setText('Upload')
		const clickCallback = () => {
			handleFileUpload()
		}
		$webApp.MainButton.onClick(clickCallback)

		return () => {
			$webApp.MainButton.hide()
		}
	})

	let file: File | null = null
	let message: string | null = null

	const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		const target = e.target as HTMLInputElement
		console.log(target.files)
		if (target?.files && target.files.length > 0) {
			file = target.files[0]
			$webApp.MainButton.show()
		}
	}
</script>

<h1 class="mb-4 text-2xl text-text">Choose siq file</h1>
<input type="file" name="pack" on:change={handleInputChange} />

{#if message}
	<p class="text-center text-danger">{message}</p>
{/if}

{#if gameLink}
	<p class="text-center text-accent-dark">
		Game
		<a href={gameLink} target="_blank" rel="noopener noreferrer" class="underline">link</a>
	</p>
{/if}
