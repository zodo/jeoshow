<div class="flex h-full w-full flex-col items-center justify-center">
	<slot />
</div>

<style lang="postcss">
	:global(body) {
		@apply m-0 h-full w-full overflow-hidden overscroll-none bg-bg-main font-sans text-text-normal;
	}

	:global(html) {
		@apply h-full w-full;
	}

	:global(:root) {
		--color-bg-main: #fdf6e3;
		--color-bg-secondary: #f3e0c3;
		--color-bg-section: #f3e0c3;
		--color-danger: #ff6b6b;
		--color-warn: #ffd166;
		--color-bg-accent: #ffad5a;
		--color-text-accent: #fff;
		--color-text-neutral: #b8a398;
		--color-text-normal: #4e342e;
		--color-text-section-header: #4e342e;
		--height: min(1000px, 100dvh);
	}

	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--color-bg-main: #000;
			--color-bg-secondary: #272822;
			--color-bg-section: #272822;
			--color-danger: #bd1b36;
			--color-warn: #e2b476;
			--color-bg-accent: #d6801e;
			--color-text-accent: #ffffff;
			--color-text-neutral: #c0c0c0;
			--color-text-normal: #eceff1;
			--color-text-section-header: #fafafa;
		}
	}
</style>
