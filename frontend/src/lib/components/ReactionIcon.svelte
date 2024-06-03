<script lang="ts">
	import { spring } from 'svelte/motion'

	export let emoji: { icon: string; x: number; y: number; size: number; selected: boolean }

	const emojiSpringPosition = spring(
		{ x: emoji.x, y: emoji.y },
		{
			stiffness: 0.2,
			damping: 0.5,
		}
	)

	$: emojiSpringPosition.set({ x: emoji.x, y: emoji.y })

	const emojiSpringSize = spring(emoji.size, {
		stiffness: 0.2,
		damping: 0.4,
	})

	$: emojiSpringSize.set(emoji.size)
</script>

<div
	style="transform: translate({$emojiSpringPosition.x}px, {$emojiSpringPosition.y}px) scale({$emojiSpringSize})"
>
	{emoji.icon}
</div>
