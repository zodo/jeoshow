<script lang="ts">
	import { goto } from '$app/navigation'
	import FileUploader from '$lib/components/FileUploader.svelte'
	import PackBrowser from '$lib/components/PackBrowser.svelte'

	const onGameCreated = (e: CustomEvent<{ gameId: string }>) => goto(`/game/${e.detail.gameId}`)
</script>

<div class="w-full max-w-screen-sm overflow-y-auto px-4 py-6">
<FileUploader on:game-created={onGameCreated} />

<h2 class="text-text mt-8 mb-4 font-serif text-xl">Или выбери из популярных</h2>

<PackBrowser on:game-created={onGameCreated} />
</div>
