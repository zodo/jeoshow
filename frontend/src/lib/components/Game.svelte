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
</script>

<section
	class="grid h-[calc(100vh-2rem)] max-h-[850px] w-full max-w-[950px] select-none grid-cols-[1fr] grid-rows-[fit-content(30%)_1fr_3rem] gap-4 [grid-template-areas:'players''stage''controls'] landscape:grid-cols-[1fr_3.5fr] landscape:grid-rows-[1fr_3rem] landscape:[grid-template-areas:'players_stage''players_controls']"
	in:scale={{ duration: 700, easing: quintInOut }}
>
	<div class="relative overflow-scroll drop-shadow-md [grid-area:players]">
		<PlayerList {players} />
	</div>
	<div
		class={cn(
			'overflow-scroll rounded-3xl  bg-background-darker transition-colors [grid-area:stage]',
			blinkStage && 'bg-accent transition-none'
		)}
	>
		<Stage {stage} {userId} {players} on:action />
	</div>
	<div class="[grid-area:controls]">
		<Controls {stage} {userId} on:action />
	</div>

	<DisconnectedOverlay showOverlay={disconnected} />
</section>
