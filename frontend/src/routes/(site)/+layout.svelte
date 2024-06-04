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
		--color-text-accent: #110b0a;
		--color-text-neutral: #b8a398;
		--color-text-normal: #4e342e;
		--color-text-section-header: #4e342e;
		--height: min(1000px, 100dvh);
	}

	@media (prefers-color-scheme: dark) {
		:global(:root) {
			--color-bg-main: #2e2724;
			--color-bg-secondary: #3c3431;
			--color-bg-section: #3c3431;
			--color-danger: #ff4040;
			--color-warn: #ff9f1a;
			--color-bg-accent: #d56b00;
			--color-text-accent: #f9ebd7;
			--color-text-neutral: #ceb7ac;
			--color-text-normal: #f3e0c3;
			--color-text-section-header: #f3e0c3;
		}
	}
</style>
