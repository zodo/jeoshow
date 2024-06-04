<script lang="ts">
	import { goto } from '$app/navigation'
	import FileUploader from '$lib/components/FileUploader.svelte'
</script>

<h1 class="text-text font-serif text-xl">Загрузи пак</h1>
<p class="text-text mb-4 mt-1 font-serif text-sm">
	Скачивай паки с
	<a href="https://sigame.xyz/" target="_blank" rel="noopener noreferrer" class="text-bg-accent">
		https://sigame.xyz/
	</a>
</p>

<FileUploader on:game-created={(e) => goto(`/game/${e.detail.gameId}`)} />
