<script lang="ts">
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import type { ViewState } from '$lib/models'

	export let players: ViewState.ExtendedPlayer[] = []
</script>

<section
	class="align-center flex h-full flex-col justify-center-safe"
	in:scale={{ duration: 300, easing: quintInOut }}
>
	<h1 class="text-center text-xl font-bold">Готово</h1>

	<table class="mt-4 border-collapse">
		{#each players as player (player.id)}
			<tr>
				<td class="border-neutral border-2 p-2 text-right">{player.score}</td>
				<td class="border-neutral border-2 p-2">{player.name}</td>
			</tr>
		{/each}
	</table>
</section>
