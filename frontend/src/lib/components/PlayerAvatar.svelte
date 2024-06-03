<script lang="ts">
	import { cn } from '$lib/style-utils'
	import type { Player } from 'shared/models/models'

	export let player: Player
	export let sizeRem = 2

	const colorFromName = (name: string) => {
		const colors = [
			['bg-red-300', 'text-red-950'],
			['bg-yellow-300', 'text-yellow-950'],
			['bg-green-300', 'text-green-950'],
			['bg-blue-300', 'text-blue-950'],
			['bg-indigo-300', 'text-indigo-950'],
			['bg-purple-300', 'text-purple-950'],
			['bg-pink-300', 'text-pink-950'],
		]

		const charCodeSum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
		const colorIndex = charCodeSum % colors.length

		return colors[colorIndex]
	}

	const [bgColor, textColor] = colorFromName(player.name)
</script>

{#if player.avatarUrl}
	<img
		src={player.avatarUrl}
		alt="avatar"
		class="rounded-full"
		style:width={sizeRem + 'rem'}
		style:height={sizeRem + 'rem'}
	/>
{:else}
	<div
		class={cn('flex items-center justify-center rounded-full', bgColor, textColor)}
		style:width={sizeRem + 'rem'}
		style:height={sizeRem + 'rem'}
	>
		<div class="text-xl font-bold" style:font-size={sizeRem - 0.5 + 'rem'}>
			{player.name.length > 0 ? player.name[0].toUpperCase() : '?'}
		</div>
	</div>
{/if}
