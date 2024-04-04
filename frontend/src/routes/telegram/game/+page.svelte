<script lang="ts">
	import InteractiveGame from '$lib/components/InteractiveGame.svelte'
	import type { SvelteCustomEvent } from '$lib/models'
	import { getWebapp } from '$lib/tg-webapp-context'
	import type { EventParams } from '@twa-dev/types'
	import { onMount } from 'svelte'
	import type { PageData } from './$types'
	import { fly, scale, slide } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { PUBLIC_FRONTEND_ROOT_URL } from '$env/static/public'

	export let data: PageData

	const webApp = getWebapp()

	let gameCode = $webApp.initDataUnsafe.start_param
	let userId = $webApp.initDataUnsafe.user?.id?.toString()
	let playerName = $webApp.initDataUnsafe.user?.first_name
	let avatarUrl = `/telegram/user-photo/${userId}`

	let expanded = $webApp.isExpanded
	let settingsVisible = false

	const handleViewportChanged = (e: EventParams['viewportChanged']) => {
		if (e.isStateStable) {
			expanded = $webApp.isExpanded || $webApp.viewportHeight > 600
		}
	}

	const handleSettingsClick = () => {
		settingsVisible = !settingsVisible
	}

	const handleOpenInBrowser = () => {
		setTimeout(() => {
			$webApp.disableClosingConfirmation()
			$webApp.close()
		}, 100)
		$webApp.openLink(
			`${PUBLIC_FRONTEND_ROOT_URL}/game/${gameCode}?user_id=${userId}&player_name=${playerName}&avatar_url=${avatarUrl}`
		)
	}

	onMount(() => {
		if (data.gameExists) {
			$webApp.enableClosingConfirmation()
		}
		$webApp.onEvent('viewportChanged', handleViewportChanged)

		$webApp.SettingsButton.show()
		$webApp.SettingsButton.onClick(handleSettingsClick)

		return () => {
			$webApp.disableClosingConfirmation()
			$webApp.offEvent('viewportChanged', handleViewportChanged)
			$webApp.SettingsButton.offClick(handleSettingsClick)
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

{#if settingsVisible}
	<button class="absolute inset-0 cursor-default" on:click={() => (settingsVisible = false)}>
		<div
			transition:fly={{ duration: 500, easing: quintInOut, y: -100 }}
			class="absolute right-1 top-1 rounded-md bg-bg-section p-2 shadow-md"
		>
			<button class="text-sm" on:click={handleOpenInBrowser}>Открыть в браузере</button>
		</div>
	</button>
{/if}
