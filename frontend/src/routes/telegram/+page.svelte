<script lang="ts">
	import { getWebapp } from '$lib/tg-webapp-context'
	import FileUploader from '$lib/components/FileUploader.svelte'

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
</script>

<h1 class="text-text mb-4 font-serif text-xl">Загрузи пак</h1>

<FileUploader on:game-created={(e) => notifyComplete(e.detail.gameId, e.detail.packName)} />
