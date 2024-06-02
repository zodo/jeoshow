<script lang="ts">
	import { spring } from 'svelte/motion'

	export let emoji: { icon: string; y: number; size: number; selected: boolean }

	const emojiSpringY = spring(emoji.y, {
		stiffness: 0.2,
		damping: 0.5,
	})

	$: emojiSpringY.set(emoji.y)

	const emojiSpringSize = spring(emoji.size, {
		stiffness: 0.2,
		damping: 0.4,
	})

	$: emojiSpringSize.set(emoji.size)
</script>

<div style="transform: translate(0, {$emojiSpringY}px) scale({$emojiSpringSize})">
	{emoji.icon}
</div>
