<script lang="ts">
	import '../app.css'
</script>

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

	:global(button) {
		-webkit-tap-highlight-color: transparent;
	}
</style>
