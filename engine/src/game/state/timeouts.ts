import type { PackModel } from 'shared/models/siq'

export namespace Timeouts {
	export const selectQuestion = 60
	export const awaitingHit = 5
	export const awaitingAnswer = 360
}

export const getFragmentsTime = (fragments: PackModel.FragmentGroup[]): number => {
	let totalTimeSeconds = 0
	for (const fragment of fragments.flatMap((f) => f)) {
		if (fragment.type === 'text') {
			totalTimeSeconds += fragment.value.length / 10
		} else if (fragment.type === 'image') {
			totalTimeSeconds += 5
		} else if (fragment.type === 'audio' || fragment.type === 'video') {
			totalTimeSeconds += fragment.time ?? 14
		}
	}
	const minTime = 4
	const maxTime = 15
	return Math.floor(Math.min(Math.max(totalTimeSeconds, minTime), maxTime) + 1)
}
