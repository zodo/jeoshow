<script lang="ts">
	import type { StageSnapshot } from 'shared/models/models'
	import PlayerList from '$lib/components/PlayerList.svelte'
	import Stage from '$lib/components/Stage.svelte'
	import DisconnectedOverlay from './DisconnectedOverlay.svelte'
	import type { ExtendedPlayer } from '$lib/models'
	import Controls from './Controls.svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'

	export let userId: string
	export let players: ExtendedPlayer[] = []
	export let stage: StageSnapshot
	export let disconnected = false
	export let blinkStage = false
	export let showPlayers = true
</script>

<section
	class="grid h-[var(--height)] w-full select-none grid-cols-[1fr] grid-rows-[fit-content(30%)_1fr_2.5rem] gap-2 px-1 py-2"
	in:scale={{ duration: 700, easing: quintInOut }}
>
	<div class="relative overflow-scroll">
		{#if showPlayers}
			<PlayerList {players} />
		{/if}
	</div>
	<div
		class={cn(
			'bg-bg-secondary h-full overflow-hidden rounded-lg transition-colors',
			blinkStage && 'bg-bg-accent transition-none'
		)}
	>
		<Stage {stage} {userId} {players} on:action />
	</div>
	<div>
		<Controls {stage} {userId} on:action />
	</div>

	<DisconnectedOverlay showOverlay={disconnected} />
</section>
