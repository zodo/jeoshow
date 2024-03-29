<script lang="ts">
	import { quintInOut } from 'svelte/easing'
	import { scale } from 'svelte/transition'

	export let resolution: boolean
</script>

<section
	class="align-center flex h-full flex-col justify-center text-center"
	in:scale={{ duration: 300, easing: quintInOut }}
>
	<h1 class="mb-4 text-3xl">Appeal</h1>

	{#if resolution}
		<p class="text-accent">Approved</p>
	{:else}
		<p class="text-danger">No no</p>
	{/if}
</section>
