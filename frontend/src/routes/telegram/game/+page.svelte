<script lang="ts">
	import InteractiveGame from '$lib/components/InteractiveGame.svelte'
	import type { SvelteCustomEvent } from '$lib/models'
	import { getWebapp } from '$lib/tg-webapp-context'
	import type { EventParams } from '@twa-dev/types'
	import { onMount } from 'svelte'
	import type { PageData } from './$types'

	export let data: PageData

	const webApp = getWebapp()

	let gameCode = $webApp.initDataUnsafe.start_param
	let userId = $webApp.initDataUnsafe.user?.id?.toString()
	let playerName = $webApp.initDataUnsafe.user?.first_name
	let avatarUrl = `/telegram/user-photo/${userId}`

	let expanded = $webApp.isExpanded

	const handleViewportChanged = (e: EventParams['viewportChanged']) => {
		if (e.isStateStable) {
			expanded = $webApp.isExpanded || $webApp.viewportHeight > 600
		}
	}

	onMount(() => {
		if (data.gameExists) {
			$webApp.enableClosingConfirmation()
		}
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

{#if !gameCode || !userId || !playerName}
	<p class="text-danger">Что-то прям пошло не так</p>
{:else if !data.gameExists}
	<div class="text-center">
		Игра кончилась или не начиналась. Создай новую тут
		<a class="text-bg-accent" href="https://t.me/jeoshow_bot">@jeoshow_bot</a>
	</div>
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
