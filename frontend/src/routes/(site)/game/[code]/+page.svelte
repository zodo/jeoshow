<script lang="ts">
	import { page } from '$app/stores'
	import InteractiveGame from '$lib/components/InteractiveGame.svelte'
	import posthog from 'posthog-js'
	import { onMount } from 'svelte'

	const gameExists: boolean = $page.data.gameExists
	const gameCode: string = $page.data.gameCode
	const userId: string = $page.data.userId
	const avatarUrl: string = $page.data.avatarUrl
	const existingPlayerName: string = $page.data.playerName

	onMount(() => {
		if (!existingPlayerName) {
			const initValue = localStorage.getItem('userName') ?? ''
			playerName = initValue
			loadedFromLocalStorage = true
		}

		history.replaceState({}, '', window.location.pathname)
	})

	let loadedFromLocalStorage = false
	let playerName: string = existingPlayerName
	let joinedGame = existingPlayerName && existingPlayerName !== ''

	const isNameValid = (name: string) => typeof name === 'string' && name.length > 0

	const handleJoin = () => {
		localStorage.setItem('userName', playerName)
		joinedGame = true
		posthog.identify(userId, { name: playerName, avatarUrl })
	}
</script>

{#if !gameExists}
	<section class="flex max-w-full flex-col items-center">
		<p>Game not found</p>
		<a href="/">Go home</a>
	</section>
{:else if joinedGame}
	<InteractiveGame {gameCode} {userId} {playerName} {avatarUrl} />
{:else}
	<section class="flex max-w-full flex-col items-center">
		<div class="mb-4 font-mono">{$page.url}</div>
		<form class="flex drop-shadow-md" on:submit|preventDefault={handleJoin}>
			<input
				class="rounded-l-md border-2 border-b-4 border-r-0 border-text-normal bg-bg-secondary p-4 text-text-normal"
				name="somerandom"
				type="text"
				bind:value={playerName}
				autocomplete="off"
				placeholder={loadedFromLocalStorage ? 'Your name' : ''}
			/>
			<button
				class="border-l-1 cursor-pointer rounded-r-md border-2 border-b-4 border-text-normal bg-bg-accent p-4 text-text-accent"
				type="submit"
				disabled={!isNameValid(playerName)}>Join</button
			>
		</form>
	</section>
{/if}
