<script lang="ts">
	import { enhance } from '$app/forms'
	import type { ChangeEventHandler, EventHandler } from 'svelte/elements'
	import type { ActionData } from './$types'

	export let form: ActionData
	let formLoading = false
	let hasFiles = false

	const handleInputChange: ChangeEventHandler<HTMLInputElement> = (e) => {
		const target = e.target as HTMLInputElement
		hasFiles = (target?.files && target.files.length > 0) ?? false
	}
</script>

<section>
	<form
		method="post"
		enctype="multipart/form-data"
		use:enhance={() => {
			formLoading = true
			return async ({ result, update }) => {
				formLoading = false
				update()
			}
		}}
	>
		<input id="pack" type="file" name="pack" on:change={handleInputChange} />
		<button type="submit" disabled={formLoading || !hasFiles}>
			{#if formLoading}
				Loading...
			{:else}
				Upload
			{/if}
		</button>
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

	input:hover {
		background-color: var(--color-accent-dark);
	}

	p {
		text-align: center;
		color: var(--color-danger);
	}
</style>
