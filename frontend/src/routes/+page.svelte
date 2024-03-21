<script lang="ts">
	import UploadFile from '$lib/UploadFile.svelte'
	import Username from '$lib/Username.svelte'
	import { PUBLIC_ENGINE_URL } from '$env/static/public'
	import { goto } from '$app/navigation'

	let uploadedPackId: string | null = '20a7156dbaa92f87d88e94ad2345330297257502'

	const onFileUploadFinished = (packId: string) => {
		console.log('File uploaded with id:', packId)
		uploadedPackId = packId
	}

	const createGame = async () => {
		const res = await fetch(`http://${PUBLIC_ENGINE_URL}/create-game`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				packId: uploadedPackId,
			}),
		})
		const data = (await res.json()) as any
		goto(`/game/${data.gameCode}`)
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<input type="text" bind:value={uploadedPackId} placeholder="Enter the pack id" />

	{#if uploadedPackId}
		<p>File uploaded with id: {uploadedPackId}</p>
		<button on:click={createGame}>Create game</button>
	{:else}
		<Username />
		<UploadFile onFinished={onFileUploadFinished} />
	{/if}
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
