<script lang="ts">
	import type { ViewState } from '$lib/models'
	import { flip } from 'svelte/animate'
	import Player from './Player.svelte'
	import { cn } from '$lib/style-utils'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	export let players: ViewState.ExtendedPlayer[] = []
</script>

<section
	in:scale={{ duration: 800, easing: quintInOut }}
	class="flex h-full select-none flex-wrap content-start items-center gap-2"
>
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
