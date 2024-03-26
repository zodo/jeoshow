<script lang="ts">
	import { page } from '$app/stores'
	import GameLogic from '$lib/components/GameLogic.svelte'
	import { onMount } from 'svelte'

	const errorMessage: string = $page.data.errorMessage
	const gameCode: string = $page.data.gameCode
	const userId: string = $page.data.userId
	const existingPlayerName: string = $page.data.playerName

	onMount(() => {
		const initValue = localStorage.getItem('userName') ?? ''
		playerName = initValue
		loadedFromLocalStorage = true
	})

	let loadedFromLocalStorage = false
	let playerName: string = existingPlayerName
	let joinedGame = existingPlayerName && existingPlayerName !== ''

	const isNameValid = (name: string) => typeof name === 'string' && name.length > 0

	const handleJoin = () => {
		localStorage.setItem('userName', playerName)
		joinedGame = true
	}
</script>

{#if errorMessage}
	<section>
		<p>{errorMessage}</p>
		<a href="/">Go home</a>
	</section>
{:else if joinedGame}
	<GameLogic {gameCode} {userId} {playerName} />
{:else}
	<section>
		<div class="text-to-copy">{$page.url}</div>
		<form on:submit|preventDefault={handleJoin}>
			<input
				name="somerandom"
				type="text"
				bind:value={playerName}
				autocomplete="off"
				placeholder={loadedFromLocalStorage ? 'Your name' : ''}
			/>
			<button type="submit" disabled={!isNameValid(playerName)}>Join</button>
		</form>
	</section>
{/if}

<style>
	section {
		max-width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
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
		cursor: pointer;
	}

	input {
		font-size: 1rem;
		margin: 0;
		padding: 1rem;
		border: none;
		border-radius: 1rem 0 0 1rem;
		background-color: var(--color-neutral);
	}

	.text-to-copy {
		margin-bottom: 1rem;
		font-family: var(--font-mono);
	}
</style>
