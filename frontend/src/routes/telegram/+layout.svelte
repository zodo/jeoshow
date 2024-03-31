<script lang="ts">
	import { browser, dev } from '$app/environment'
	import { goto } from '$app/navigation'
	import { setWebappContext } from '$lib/tg-webapp-context'
	import type { WebApp } from '@twa-dev/types'
	import { onMount, setContext } from 'svelte'
	import { writable } from 'svelte/store'

	let hasMounted = false
	let webapp = writable<WebApp | null>(null)
	setWebappContext(webapp)

	onMount(async () => {
		if (browser) {
			const tgWebAppImport = await import('@twa-dev/sdk')
			const tgWebApp = tgWebAppImport.default
			if (!tgWebApp.initData && !dev) {
				await goto('/')
			}
			tgWebApp.ready()
			$webapp = tgWebApp
			hasMounted = true
		}
	})
</script>

<div class="flex h-[var(--height)] flex-col items-center justify-center">
	{#if hasMounted}
		<slot />
	{/if}
</div>

<style lang="postcss">
	:global(:root) {
		--color-background: var(--tg-theme-secondary-bg-color, #fff);
		--color-background-darker: var(--tg-theme-bg-color, #bbb);
		--color-danger: var(--tg-theme-destructive-text-color, #ff5252);
		--color-warn: #ffd166;
		--color-accent: var(--tg-theme-button-color, #5aadff);
		--color-accent-dark: #f57c00;
		--color-neutral: var(--tg-theme-hint-color, #999);
		--color-text: var(--tg-theme-text-color, #333);

		--height: var(--tg-viewport-stable-height, 100dvh);
	}
</style>
