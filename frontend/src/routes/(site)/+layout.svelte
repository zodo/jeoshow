<div class="flex h-full w-full flex-col items-center justify-center p-4">
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
		--height: min(850px, 100dvh);
	}
</style>
