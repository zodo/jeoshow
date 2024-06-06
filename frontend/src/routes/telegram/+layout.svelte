<script lang="ts">
	import { browser, dev } from '$app/environment'
	import { goto } from '$app/navigation'
	import { setWebappContext } from '$lib/tg-webapp-context'
	import type { WebApp } from '@twa-dev/types'
	import posthog from 'posthog-js'
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

			// if (tgWebApp.colorScheme === 'dark') {
			// 	tgWebApp.setHeaderColor('#2e2724')
			// } else {
			//  tgWebApp.setHeaderColor('#fdf6e3')
			// }
			tgWebApp.setHeaderColor('#fdf6e3')

			posthog.identify(tgWebApp.initDataUnsafe.user?.id?.toString(), {
				name: tgWebApp.initDataUnsafe.user?.first_name,
			})

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
	:global(body) {
		@apply h-screen w-full overflow-hidden bg-bg-main font-sans text-text-normal;
	}

	/* Unused styles based on tg client */
	/* :global(:root) {
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
	} */

	:global(:root) {
		--color-bg-main: #fdf6e3;
		--color-bg-secondary: #f3e0c3;
		--color-bg-section: #f3e0c3;
		--color-danger: #ff6b6b;
		--color-warn: #ffd166;
		--color-bg-accent: #ffad5a;
		--color-text-accent: #110b0a;
		--color-text-neutral: #b8a398;
		--color-text-normal: #4e342e;
		--color-text-section-header: #4e342e;

		--height: var(--tg-viewport-stable-height, 100dvh);

		color: var(--color-text-normal);
		background-color: var(--color-bg-main);

		/* color-scheme: var(--tg-color-scheme, light); */
	}

	/* @media (prefers-color-scheme: dark) {
		:global(:root) {
			--color-bg-main: #2e2724;
			--color-bg-secondary: #3c3431;
			--color-bg-section: #3c3431;
			--color-danger: #ff4040;
			--color-warn: #ff9f1a;
			--color-bg-accent: #d56b00;
			--color-text-accent: #fff;
			--color-text-neutral: #a6938a;
			--color-text-normal: #f3e0c3;
			--color-text-section-header: #f3e0c3;
		}
	} */
</style>
