<script lang="ts">
	import type { ExtendedPlayer } from '$lib/models'
	import { flip } from 'svelte/animate'
	import Player from './Player.svelte'
	import { cn } from '$lib/style-utils'

	export let players: ExtendedPlayer[] = []
</script>

<section class="flex h-full select-none flex-wrap content-start items-center gap-2">
	{#each players as player (player.id)}
		<div
			class={cn('flex-auto', {
				'basis-full': player.active,
			})}
			animate:flip={{ duration: 300 }}
		>
			<Player {player} />
		</div>
	{/each}
</section>
