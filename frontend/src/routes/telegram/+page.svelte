<script lang="ts">
	import { getWebapp } from '$lib/tg-webapp-context'
	import FileUploader from '$lib/components/FileUploader.svelte'
	import PackBrowser from '$lib/components/PackBrowser.svelte'

	const webApp = getWebapp()

	const notifyComplete = (gameCode: string, packName: string) => {
		fetch('/telegram/bot-handler/notify-upload-complete', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				queryId: $webApp.initDataUnsafe.query_id,
				gameCode,
				packName,
			}),
		})
	}

	const onGameCreated = (e: CustomEvent<{ gameId: string; packName: string }>) =>
		notifyComplete(e.detail.gameId, e.detail.packName)
</script>

<div class="w-full max-w-screen-sm overflow-y-auto px-4 py-6">
	<FileUploader on:game-created={onGameCreated} />

	<h2 class="text-text mt-8 mb-4 font-serif text-xl">Или выбери из популярных</h2>

	<PackBrowser on:game-created={onGameCreated} />
</div>
