<script lang="ts">
	import InteractiveGame from '$lib/components/InteractiveGame.svelte'
	import type { SvelteCustomEvent } from '$lib/models'
	import { getWebapp } from '$lib/tg-webapp-context'
	import type { EventParams } from '@twa-dev/types'
	import { onMount } from 'svelte'

	const webApp = getWebapp()

	let gameCode = $webApp.initDataUnsafe.start_param
	let userId = $webApp.initDataUnsafe.user?.id?.toString()
	let playerName = $webApp.initDataUnsafe.user?.first_name
	let avatarUrl = `/telegram/user-photo/${userId}`

	let expanded = $webApp.isExpanded

	const handleViewportChanged = (e: EventParams['viewportChanged']) => {
		if (e.isStateStable) {
			expanded = $webApp.isExpanded
		}
	}

	onMount(() => {
		$webApp.enableClosingConfirmation()
		$webApp.onEvent('viewportChanged', handleViewportChanged)

		return () => {
			$webApp.disableClosingConfirmation()
			$webApp.offEvent('viewportChanged', handleViewportChanged)
		}
	})

	const handleHaptic = (h: CustomEvent<SvelteCustomEvent['haptic']>) => {
		const actions: Record<SvelteCustomEvent['haptic'], () => void> = {
			light: () => $webApp.HapticFeedback.impactOccurred('light'),
			medium: () => $webApp.HapticFeedback.impactOccurred('medium'),
			success: () => $webApp.HapticFeedback.notificationOccurred('success'),
			warning: () => $webApp.HapticFeedback.notificationOccurred('warning'),
		}

		actions[h.detail]()
	}
</script>

{#if !gameCode}
	<p>Game code is not provided</p>
{:else if !userId}
	<p>User ID is not provided</p>
{:else if !playerName}
	<p>User name is not provided</p>
{:else}
	<InteractiveGame
		{gameCode}
		{userId}
		{playerName}
		{avatarUrl}
		showPlayers={expanded}
		on:haptic={handleHaptic}
	/>
{/if}
