<script lang="ts">
	export let resolution: boolean
</script>

<section>
	<h1>Appeal</h1>

	{#if resolution}
		<p>Approved</p>
	{:else}
		<p>No no</p>
	{/if}
</section>
