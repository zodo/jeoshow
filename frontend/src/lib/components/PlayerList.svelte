<script lang="ts">
	import type { ViewState } from '$lib/models'
	import { flip } from 'svelte/animate'
	import Player from './Player.svelte'
	import { cn } from '$lib/style-utils'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'

	export let players: ViewState.ExtendedPlayer[] = []

	let showDebugInfo = false
	let clickCount = 0
	let clickTimeout: NodeJS.Timeout | null
	const onPlayerListClick = () => {
		clickCount++

		if (clickCount === 1) {
			clickTimeout = setTimeout(() => {
				clickCount = 0
			}, 300)
		} else if (clickCount === 3) {
			clickCount = 0
			if (clickTimeout) {
				clearTimeout(clickTimeout)
			}
			showDebugInfo = true
			setTimeout(() => {
				showDebugInfo = false
			}, 5000)
		}
	}
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<section
	in:scale={{ duration: 800, easing: quintInOut }}
	class="flex h-full select-none flex-wrap content-start items-center gap-2"
	on:click={onPlayerListClick}
>
	{#each players as player (player.id)}
		<div
			class={cn('flex-auto', {
				'basis-full': player.active,
			})}
			animate:flip={{ duration: 300 }}
		>
			<Player {player} {showDebugInfo} />
		</div>
	{/each}
</section>
