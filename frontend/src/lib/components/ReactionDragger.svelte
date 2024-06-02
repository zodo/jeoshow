<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import ReactionIcon from './ReactionIcon.svelte'
	import type { SvelteCustomEvent } from '$lib/models'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let dragging = false
	let absoluteCoordinates = { x: 0, y: 0 }
	let initialCoordinates = { x: 0, y: 0 }

	let screenWidth = 0
	let screenHeight = 0

	$: relativeCoordinates = {
		x: absoluteCoordinates.x - initialCoordinates.x,
		y: absoluteCoordinates.y - initialCoordinates.y,
	}

	$: absoluteScreenCoordinates = {
		x: Math.round((absoluteCoordinates.x / screenWidth) * 100) / 100,
		y: Math.round((absoluteCoordinates.y / screenHeight) * 100) / 100,
	}

	export function handleMouseDown(event: MouseEvent) {
		console.log('mouse down')
		dragging = true

		initialCoordinates = {
			x: event.clientX,
			y: event.clientY,
		}

		absoluteCoordinates = initialCoordinates

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
	}

	export function handleTouchStart(event: TouchEvent) {
		dragging = true

		initialCoordinates = {
			x: Math.round(event.touches[0].clientX),
			y: Math.round(event.touches[0].clientY),
		}

		absoluteCoordinates = initialCoordinates

		document.addEventListener('touchmove', handleTouchMove)
		document.addEventListener('touchend', handleTouchEnd)
	}

	function handleTouchMove(event: TouchEvent) {
		absoluteCoordinates = {
			x: Math.round(event.touches[0].clientX),
			y: Math.round(event.touches[0].clientY),
		}
	}

	function handleTouchEnd() {
		chooseEmoji()
		dragging = false

		document.removeEventListener('touchmove', handleTouchMove)
		document.removeEventListener('touchend', handleTouchEnd)
	}

	function handleMouseMove(event: MouseEvent) {
		absoluteCoordinates = {
			x: event.clientX,
			y: event.clientY,
		}
	}

	function handleMouseUp() {
		chooseEmoji()
		dragging = false

		document.removeEventListener('mousemove', handleMouseMove)
		document.removeEventListener('mouseup', handleMouseUp)
	}

	function chooseEmoji() {
		const selected = interactiveEmojis.find((emoji) => emoji.selected)
		if (selected) {
			dispatch('action', { type: 'message-send', text: selected?.icon })
		}
	}

	const emojis = ['🤔', '🤨', '😏', '😎', '🤩', '🥳', '🔥', '💩']
	let interactiveEmojis = emojis.map((icon) => ({
		icon,
		y: 0,
		size: 1,
		selected: false,
	}))
	const emojiWidth = 1 / emojis.length
	$: {
		interactiveEmojis = interactiveEmojis.map((emoji, index) => {
			if (!dragging) return { ...emoji, y: 0, size: 1, selected: false }

			const yOffsetAboveFinger = 90
			const yDeadZone = 80

			const emojiCenter = (index + 0.5) * emojiWidth
			const distance = Math.abs(absoluteScreenCoordinates.x - emojiCenter)

			const yFalloff = Math.pow(1 - distance, 2)
			const y =
				relativeCoordinates.y * yFalloff +
				Math.max(
					(yFalloff * yOffsetAboveFinger * relativeCoordinates.y) / yDeadZone,
					-yOffsetAboveFinger
				)

			const selected = distance < emojiWidth / 2 && relativeCoordinates.y < -yDeadZone

			const sizeIncreaseFactor = Math.max(0, Math.min(1, (-yDeadZone / 2 - y) / yDeadZone))
			const size = 1 + sizeIncreaseFactor + (selected ? 2 : 0)

			if (selected && !emoji.selected) {
				dispatch('haptic', 'medium')
			}

			return {
				...emoji,
				y: Math.min(y, 0),
				size,
				selected,
			}
		})
	}
</script>

<svelte:window bind:innerWidth={screenWidth} bind:innerHeight={screenHeight} />

<div class="absolute -bottom-10 z-20 -m-2 flex h-10 w-full justify-around text-xs">
	{#each interactiveEmojis as emoji}
		<ReactionIcon {emoji} />
	{/each}
</div>
