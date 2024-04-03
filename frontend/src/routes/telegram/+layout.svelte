<script lang="ts">
	import { browser, dev } from '$app/environment'
	import { goto } from '$app/navigation'
	import { setWebappContext } from '$lib/tg-webapp-context'
	import type { WebApp } from '@twa-dev/types'
	import { onMount } from 'svelte'
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
			await (await import('eruda')).default.init()
		}
	})
</script>

<div class="flex h-[var(--height)] flex-col items-center justify-center">
	{#if hasMounted}
		<slot />
	{/if}
</div>

<style lang="postcss">
	:global(body) {
		@apply m-0 h-full w-full overflow-hidden overscroll-none bg-bg-main font-sans text-text-normal;
	}

	:global(html) {
		@apply h-full w-full;
	}

	:global(:root) {
		--color-bg-main: var(--tg-theme-bg-color, #fff);
		--color-bg-secondary: var(--tg-theme-secondary-bg-color, #bbb);
		--color-bg-section: var(--tg-theme-section-bg-color, #bbb);
		--color-danger: var(--tg-theme-destructive-text-color, #ff5252);
		--color-warn: #ffd166;
		--color-bg-accent: var(--tg-theme-button-color, #5aadff);
		--color-text-accent: var(--tg-theme-button-text-color, #fff);
		--color-text-neutral: var(--tg-theme-hint-color, #999);
		--color-text-normal: var(--tg-theme-text-color, #333);
		--color-text-section-header: var(--tg-theme-section-header-text-color, #5d7697);

		--height: var(--tg-viewport-stable-height, 100dvh);

		color: var(--color-text-normal);
		background-color: var(--color-bg-main);
	}
</style>
