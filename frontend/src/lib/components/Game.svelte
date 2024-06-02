<script lang="ts">
	import PlayerList from '$lib/components/PlayerList.svelte'
	import Stage from '$lib/components/Stage.svelte'
	import DisconnectedOverlay from './DisconnectedOverlay.svelte'
	import type { ViewState } from '$lib/models'
	import Controls from './Controls.svelte'
	import { scale } from 'svelte/transition'
	import { quintInOut } from 'svelte/easing'
	import { cn } from '$lib/style-utils'

	export let state: ViewState.View
</script>

<section
	class="grid h-[var(--height)] w-full max-w-[1200px] select-none grid-cols-[1fr] grid-rows-[fit-content(30%)_1fr_2.5rem] gap-2 px-1 py-2"
	in:scale={{ duration: 700, easing: quintInOut }}
>
	<div class="relative overflow-scroll">
		{#if state.showPlayers}
			{#if state.stage.type === 'connecting'}
				<div class="h-7"></div>
			{:else}
				<PlayerList players={state.players} />
			{/if}
		{/if}
	</div>
	<div
		class={cn(
			'h-full overflow-hidden rounded-lg bg-bg-secondary transition-colors',
			state.stageBlink && 'bg-bg-accent transition-none'
		)}
	>
		<Stage {state} on:action on:haptic />
	</div>
	<div>
		{#if state.stage.type === 'connecting'}
			<div class="h-10"></div>
		{:else}
			<Controls controls={state.controls} on:action on:haptic />
		{/if}
	</div>

	<DisconnectedOverlay showOverlay={state.disconnected} />
</section>
