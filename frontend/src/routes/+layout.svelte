<div class="app">
	<main>
		<slot />
	</main>
</div>

<style>
	:global(:root) {
		--color-background: #e6ebe0;
		--color-danger: #ed6a5a;
		--color-warn: #f4f1bb;
		--color-accent: #36c9c6;
		--color-neutral: #9bc1bc;
		--color-text: #1a2927;
	}

	:global(html),
	:global(body) {
		height: 100%;
		width: 100%;
		overflow: hidden;
		overscroll-behavior: none;
		margin: 0;
		background-color: var(--color-background);
		color: var(--color-text);
		font-family:
			-apple-system,
			BlinkMacSystemFont,
			avenir next,
			avenir,
			segoe ui,
			helvetica neue,
			helvetica,
			Cantarell,
			Ubuntu,
			roboto,
			noto,
			arial,
			sans-serif;
	}

	:global(*) {
		box-sizing: border-box;
	}
</style>
