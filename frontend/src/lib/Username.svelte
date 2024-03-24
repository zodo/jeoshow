<script lang="ts">
	import { onMount } from 'svelte'
	import { writable } from 'svelte/store'

	export let onUpdate: (name: string) => void
	export const userName = writable<string>('')

	onMount(() => {
		const initValue = localStorage.getItem('userName') ?? ''
		userName.set(initValue)
		onUpdate(initValue)

		userName.subscribe((value) => {
			onUpdate(value ?? '')
			localStorage.setItem('userName', value ?? '')
		})
	})
</script>

<h3>Your name</h3>
<input name="somerandom" type="text" bind:value={$userName} autocomplete="off" />

<style>
	input {
		width: 100%;
		padding: 8px;
		margin: 10px 0;
		box-sizing: border-box;
	}
</style>
