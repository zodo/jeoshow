<script lang="ts">
	import { goto } from '$app/navigation'
	import FileUploader from '$lib/components/FileUploader.svelte'
</script>

<FileUploader on:game-created={(e) => goto(`/game/${e.detail.gameId}`)} />
