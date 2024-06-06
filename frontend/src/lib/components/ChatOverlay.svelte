<script lang="ts">
	import type { ViewState } from '$lib/models'
	import { fade, slide } from 'svelte/transition'
	import PlayerAvatar from './PlayerAvatar.svelte'
	import { flip } from 'svelte/animate'

	export let messages: ViewState.ChatMessage[]
</script>

<div
	class="pointer-events-none absolute inset-0 z-10 flex flex-col-reverse items-end gap-2 p-3 align-bottom"
>
	{#each messages as message (message.id)}
		<div
			class="flex items-end gap-2"
			out:fade={{ duration: 500 }}
			animate:flip={{ duration: 300 }}
			in:slide={{ duration: 500, axis: 'x' }}
		>
			<div
				class="mb-0.5 rounded-lg rounded-br-sm border border-b-2 border-text-normal bg-bg-main px-2 py-0.5 text-right text-text-normal"
			>
				<div class="pl-1 text-sm font-semibold leading-4">
					{message.player.name}
				</div>
				<div class="font-serif text-base font-light">{message.text}</div>
			</div>

			<PlayerAvatar player={message.player} />
		</div>
	{/each}
</div>
