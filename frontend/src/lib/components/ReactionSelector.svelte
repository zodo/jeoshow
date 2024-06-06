<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import ReactionIcon from './ReactionIcon.svelte'
	import type { SvelteCustomEvent } from '$lib/models'
	import { spring } from 'svelte/motion'
	import { cn } from '$lib/style-utils'

	const dispatch = createEventDispatcher<SvelteCustomEvent>()

	let dragging = false
	let draggingStartTime = 0
	let absoluteCoordinates = { x: 0, y: 0 }
	let initialCoordinates = { x: 0, y: 0 }

	const buttonSpring = spring(
		{ x: 0, y: 0 },
		{
			stiffness: 0.4,
			damping: 0.5,
		}
	)

	const buttonSizeSpring = spring(1, {
		stiffness: 0.3,
		damping: 0.7,
	})

	$: relativeCoordinates = {
		x: absoluteCoordinates.x - initialCoordinates.x,
		y: absoluteCoordinates.y - initialCoordinates.y,
	}

	function handleMouseDown(event: MouseEvent) {
		startDragging(event.clientX, event.clientY)

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)
	}

	function handleTouchStart(event: TouchEvent) {
		startDragging(event.touches[0].clientX, event.touches[0].clientY)

		document.addEventListener('touchmove', handleTouchMove)
		document.addEventListener('touchend', handleTouchEnd)
	}

	function handleTouchMove(event: TouchEvent) {
		absoluteCoordinates = {
			x: Math.round(event.touches[0].clientX),
			y: Math.round(event.touches[0].clientY),
		}

		window.scrollTo(0, 0) // dunno if works, try to prevent webapp collapse
	}

	function handleTouchEnd() {
		finishDragging()

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
		finishDragging()

		document.removeEventListener('mousemove', handleMouseMove)
		document.removeEventListener('mouseup', handleMouseUp)
	}

	function startDragging(x: number, y: number) {
		dragging = true

		draggingStartTime = Date.now()

		initialCoordinates = {
			x: Math.round(x),
			y: Math.round(y),
		}

		absoluteCoordinates = initialCoordinates

		buttonSizeSpring.set(0.7, { soft: true })

		dispatch('haptic', 'medium')
	}

	function finishDragging() {
		chooseEmoji()

		const draggingTime = Date.now() - draggingStartTime

		buttonSpring.set({ x: 0, y: 0 }, { soft: true })
		buttonSizeSpring.set(1, { soft: true })

		const distance = Math.sqrt(
			Math.pow(relativeCoordinates.x, 2) + Math.pow(relativeCoordinates.y, 2)
		)

		if (draggingTime < 200 && distance < 10) {
			buttonSizeSpring.set(0.7, { soft: true })
			buttonSpring.set({ x: 3, y: 3 }, { soft: true })
			setTimeout(() => {
				buttonSpring.set({ x: -10, y: -10 }, { soft: true })
			}, 150)

			setTimeout(() => {
				buttonSpring.set({ x: 0, y: 0 }, { soft: true })
				buttonSizeSpring.set(1, { soft: true })
			}, 250)
		}

		dragging = false
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
		x: 0,
		y: 0,
		size: 0,
		selected: false,
	}))

	$: {
		const radians = Math.atan2(relativeCoordinates.y, relativeCoordinates.x)
		const radius = Math.sqrt(
			Math.pow(relativeCoordinates.x, 2) + Math.pow(relativeCoordinates.y, 2)
		)
		const maxRadius = 15

		buttonSpring.set({
			x: Math.cos(radians) * Math.min(radius, maxRadius),
			y: Math.sin(radians) * Math.min(radius, maxRadius),
		})
	}

	$: {
		interactiveEmojis = interactiveEmojis.map((emoji, index) => {
			if (!dragging) return { ...emoji, x: 0, y: 0, size: 0, selected: false }

			const activationRadius = 130
			const radiusOffset = 85
			const startDegree = 195
			const endDegree = 255
			const degreeRange = endDegree - startDegree

			const distanceFromButton = Math.sqrt(
				Math.pow(relativeCoordinates.x, 2) + Math.pow(relativeCoordinates.y, 2)
			)

			// Calculate the angle for each emoji
			const degreeStep = degreeRange / (emojis.length - 1)
			const angle = startDegree + degreeStep * index
			const radians = (angle * Math.PI) / 180

			const coordinatesRadians = Math.atan2(relativeCoordinates.y, relativeCoordinates.x)
			const coordinatesDegree = ((coordinatesRadians * 180) / Math.PI + 360) % 360
			const selected =
				distanceFromButton >= activationRadius &&
				(Math.abs(coordinatesDegree - angle) < degreeStep / 2 ||
					(index === emojis.length - 1 && coordinatesDegree > endDegree) ||
					(index === 0 && coordinatesDegree < startDegree))

			const sizeIncreaseFactor =
				Math.max(
					0,
					Math.min(1, (-activationRadius / 2 + distanceFromButton) / activationRadius)
				) / 2
			const distanceToAngle = Math.min(1, Math.abs(coordinatesDegree - angle) / degreeRange)
			const distanceSizeFactor = Math.pow(2 - distanceToAngle, 2)
			const size = (0.5 + sizeIncreaseFactor * distanceSizeFactor + (selected ? 1.5 : 0)) / 2

			// Position along circular path
			const radius = distanceFromButton + radiusOffset + (selected ? 10 : 0)
			const x = radius * Math.cos(radians)
			const y = radius * Math.sin(radians)

			if (selected && !emoji.selected) {
				dispatch('haptic', 'light')
			}

			return {
				...emoji,
				x,
				y,
				size,
				selected,
			}
		})
	}
</script>

<div class="relative h-10 w-10">
	{#each interactiveEmojis as emoji}
		<div class={cn('pointer-events-none absolute inset-3 z-20', emoji.selected && 'z-30')}>
			<ReactionIcon {emoji} />
		</div>
	{/each}

	<button
		on:mousedown={handleMouseDown}
		on:touchstart={handleTouchStart}
		class="relative z-30 inline-flex h-full w-full cursor-pointer items-center justify-center"
		style="transform: translate({$buttonSpring.x}px, {$buttonSpring.y}px) scale({$buttonSizeSpring})"
	>
		<svg
			class="h-7 w-7 text-text-normal"
			aria-hidden="true"
			xmlns="http://www.w3.org/2000/svg"
			width="24"
			height="24"
			fill="none"
			viewBox="0 0 24 24"
		>
			<path
				stroke="currentColor"
				stroke-linecap="round"
				stroke-linejoin="round"
				stroke-width="2"
				d="M15 9h.01M8.99 9H9m12 3a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM6.6 13a5.5 5.5 0 0 0 10.81 0H6.6Z"
			/>
		</svg>
	</button>
</div>
