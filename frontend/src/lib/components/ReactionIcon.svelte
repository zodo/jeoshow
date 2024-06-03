<script lang="ts">
	import { spring } from 'svelte/motion'

	export let emoji: { icon: string; x: number; y: number; size: number; selected: boolean }

	const emojiSpringPosition = spring(
		{ x: emoji.x, y: emoji.y },
		{
			stiffness: 0.2,
			damping: 0.4,
		}
	)

	$: emojiSpringPosition.set({ x: emoji.x, y: emoji.y })

	const emojiSpringSize = spring(emoji.size, {
		stiffness: 0.2,
		damping: 0.4,
	})

	$: emojiSpringSize.set(emoji.size)

	$: opacity = emoji.size < 0.5 ? 0 : 1
</script>

<div
	style="transform: translate({$emojiSpringPosition.x}px, {$emojiSpringPosition.y}px) scale({$emojiSpringSize}); opacity: {opacity}; transition: opacity 0.1s ease-in-out;"
>
	{emoji.icon}
</div>
