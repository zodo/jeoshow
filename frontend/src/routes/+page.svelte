<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ActionData } from './$types'

	export let form: ActionData
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<form method="post" enctype="multipart/form-data">
		<input id="pack" type="file" name="pack" />
		<button type="submit">Upload</button>
	</form>
	{#if form?.message}
		<p>{form.message}</p>
	{/if}
</section>

<style>
	section {
		max-width: 100%;
	}

	form {
		display: flex;
	}

	button {
		margin: 0;
		padding: 1rem;
		border: none;
		border-radius: 0 1rem 1rem 0;
		background-color: var(--color-accent);
		font-size: 1rem;
		transition: background-color 0.8s;
		cursor: pointer;
	}

	button:hover {
		background-color: var(--color-accent-dark);
	}

	input {
		height: 3.5rem;
		font-size: 1rem;
		margin: 0;
		padding: 1rem;
		border: none;
		border-radius: 1rem 0 0 1rem; /* Opposite of the button to fit together */
		background-color: var(--color-neutral);
		cursor: pointer;
		display: inline-block; /* Or use flex for better control */
		transition: background-color 0.8s;
		flex: 0 1 auto;
	}

	/* Optional: Style label on hover */
	input:hover {
		background-color: var(--color-accent-dark);
	}

	p {
		text-align: center;
		color: var(--color-danger);
	}
</style>
