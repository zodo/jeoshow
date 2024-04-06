import type { PackModel } from 'shared/models/siq'

export namespace Timeouts {
	export const selectQuestion = 60
	export const awaitingHit = 5
	export const hitRandomizationInterval = 0.8
	export const awaitingAnswer = 30
	export const appealTimeout = 25
	export const appealResult = 2
	export const answerAttemptShow = 4
	export const selectAnswerShow = 4
}

export const getFragmentsTime = (fragments: PackModel.FragmentGroup[]): number => {
	let totalTimeSeconds = 0
	let hasDefinedTime = false
	for (const fragment of fragments.flatMap((f) => f)) {
		if (fragment.type === 'text') {
			if (!fragment.value) {
				console.log(JSON.stringify(fragments, null, 2))
			}
			totalTimeSeconds += fragment.value.length / 10
		} else if (fragment.type === 'image') {
			totalTimeSeconds += 7
		} else if (fragment.type === 'audio' || fragment.type === 'video') {
			hasDefinedTime = fragment.time !== undefined
			totalTimeSeconds += fragment.time ?? 12
		}
	}
	const minTime = 5

	if (hasDefinedTime) {
		return Math.floor(Math.max(totalTimeSeconds, minTime))
	}

	const maxTime = 15
	return Math.floor(Math.min(Math.max(totalTimeSeconds, minTime), maxTime) + 1)
}
