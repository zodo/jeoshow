<script lang="ts">
	import InteractiveGame from '$lib/components/InteractiveGame.svelte'
	import { getWebapp } from '$lib/tg-webapp-context'

	const webApp = getWebapp()

	let gameCode = $webApp.initDataUnsafe.start_param
	let userId = $webApp.initDataUnsafe.user?.id?.toString()
	let playerName = $webApp.initDataUnsafe.user?.first_name
</script>

{#if !gameCode}
	<p>Game code is not provided</p>
{:else if !userId}
	<p>User ID is not provided</p>
{:else if !playerName}
	<p>User name is not provided</p>
{:else}
	<InteractiveGame {gameCode} {userId} {playerName} />
{/if}
