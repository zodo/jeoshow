<script lang="ts">
	import type { ViewState } from '$lib/models'
	import { fade, slide } from 'svelte/transition'
	import PlayerAvatar from './PlayerAvatar.svelte'

	export let messages: ViewState.ChatMessage[]
</script>

<div class="pointer-events-none absolute inset-0 flex flex-col-reverse gap-2 p-3 pb-8 align-bottom">
	{#each messages as message (message.id)}
		<div
			class="flex items-center drop-shadow-md"
			in:slide={{ duration: 500 }}
			out:fade={{ duration: 500 }}
		>
			<PlayerAvatar player={message.player} />

			<div class="ml-2 text-text-normal">
				<div class="text-sm font-semibold leading-4">
					{message.player.name}
				</div>
				<div class="font-serif text-base font-light">{message.text}</div>
			</div>
		</div>
	{/each}
</div>
