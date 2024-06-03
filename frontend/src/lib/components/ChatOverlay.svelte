<script lang="ts">
	import type { ViewState } from '$lib/models'
	import { fade, slide } from 'svelte/transition'

	export let messages: ViewState.ChatMessage[]
</script>

<div class="pointer-events-none absolute inset-0 flex flex-col-reverse gap-2 p-3 pb-8 align-bottom">
	{#each messages as message (message.id)}
		<div
			class="flex items-center drop-shadow-md"
			in:slide={{ duration: 500 }}
			out:fade={{ duration: 500 }}
		>
			{#if message.player.avatarUrl}
				<img
					src={message.player.avatarUrl}
					alt="Player avatar"
					class="h-8 w-8 flex-none rounded-full"
				/>
			{:else}
				<div
					class="h-8 w-8 flex-none rounded-full bg-gray-300 text-center align-bottom text-xl font-bold text-gray-500"
				>
					?
				</div>
			{/if}

			<div class="ml-2 text-text-normal">
				<div class="text-sm font-semibold leading-4">
					{message.player.name}
				</div>
				<div class="font-serif text-base font-light">{message.text}</div>
			</div>
		</div>
	{/each}
</div>
