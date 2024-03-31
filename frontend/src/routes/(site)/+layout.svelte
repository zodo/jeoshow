<div class="flex h-full w-full flex-col items-center justify-center p-4">
	<slot />
</div>

<style lang="postcss">
	:global(body) {
		@apply m-0 h-full w-full overflow-hidden overscroll-none bg-background font-sans text-text;
	}

	:global(html) {
		@apply h-full w-full;
	}

	:global(:root) {
		--color-background: #fdf6e3;
		--color-background-darker: #f3e0c3;
		--color-danger: #ff6b6b;
		--color-warn: #ffd166;
		--color-accent: #ffad5a;
		--color-accent-dark: #f57c00;
		--color-neutral: #b8a398;
		--color-text: #4e342e;
	}
</style>
