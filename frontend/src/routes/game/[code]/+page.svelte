<script lang="ts">
	import { page } from '$app/stores'
	import Game from '$lib/components/Game.svelte'
	import Username from '$lib/Username.svelte'

	const gameCode: string = $page.data.gameCode
	const userId: string = $page.data.userId

	let userName: string
	let joinedGame = false

	const isNameValid = (name: string) => typeof name === 'string' && name.length > 0

	$: {
		console.log(isNameValid(userName), userName)
	}
</script>

{#if joinedGame}
	<Game {gameCode} {userId} {userName} />
{:else}
	<Username onUpdate={(name) => (userName = name)} />
	<button on:click={() => (joinedGame = true)} disabled={!isNameValid(userName)}>Join</button>
{/if}
