<script lang="ts">
	import { page } from '$app/stores'
	import InteractiveGame from '$lib/components/InteractiveGame.svelte'
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
	<section class="flex max-w-full flex-col items-center">
		<p>{errorMessage}</p>
		<a href="/">Go home</a>
	</section>
{:else if joinedGame}
	<InteractiveGame {gameCode} {userId} {playerName} />
{:else}
	<section class="flex max-w-full flex-col items-center">
		<div class="mb-4 font-mono">{$page.url}</div>
		<form class="flex drop-shadow-md" on:submit|preventDefault={handleJoin}>
			<input
				class="bg-neutral rounded-l-2xl p-4"
				name="somerandom"
				type="text"
				bind:value={playerName}
				autocomplete="off"
				placeholder={loadedFromLocalStorage ? 'Your name' : ''}
			/>
			<button
				class="rounded-r-2xl bg-bg-accent p-4 text-text-accent"
				type="submit"
				disabled={!isNameValid(playerName)}>Join</button
			>
		</form>
	</section>
{/if}
