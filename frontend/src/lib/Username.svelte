<script lang="ts">
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	export const userName = writable<string | null>(null)

	onMount(async () => {
		userName.set(localStorage.getItem('userName'))

		userName.subscribe((value) => {
			localStorage.setItem('userName', value ?? '')
		})
	})
</script>

<input type="text" bind:value={$userName} placeholder="Enter your name" />
