import type { PackModel } from 'shared/models/siq'

export namespace Timeouts {
	export const selectQuestion = 60
	export const awaitingHit = 5
	export const awaitingAnswer = 360
	export const appealTimeout = 25
	export const appealResult = 3
}

export const getFragmentsTime = (fragments: PackModel.FragmentGroup[]): number => {
	let totalTimeSeconds = 0
	let hasDefinedTime = false
	for (const fragment of fragments.flatMap((f) => f)) {
		if (fragment.type === 'text') {
			totalTimeSeconds += fragment.value.length / 10
		} else if (fragment.type === 'image') {
			totalTimeSeconds += 10
		} else if (fragment.type === 'audio' || fragment.type === 'video') {
			hasDefinedTime = fragment.time !== undefined
			totalTimeSeconds += fragment.time ?? 15
		}
	}
	const minTime = 7

	if (hasDefinedTime) {
		return Math.floor(Math.max(totalTimeSeconds, minTime))
	}

	const maxTime = 15
	return Math.floor(Math.min(Math.max(totalTimeSeconds, minTime), maxTime) + 1)
}
