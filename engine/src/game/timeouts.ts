import type { PackModel } from 'shared/models/siq'

export namespace Timeouts {
	export const selectQuestion = 60
	export const awaitingHit = 5
	export const awaitingAnswer = 30
	export const appealTimeout = 25
	export const appealResult = 2
	export const answerAttemptShow = 3
	export const selectAnswerShow = 4
	export const mediaTimeout = 30
	export const mediaReturnDelayAfterFinishedTimeout = 2
	export const roundSkipVoting = 10
}

export type FragmentsTime = {
	seconds: number
	hasMedia: boolean
}
export const getFragmentsTime = (fragments: PackModel.FragmentGroup[]): FragmentsTime => {
	let totalTimeSeconds = 0
	let hasDefinedTime = false
	let hasMedia = false
	for (const fragment of fragments.flatMap((f) => f)) {
		if (fragment.type === 'text') {
			totalTimeSeconds += fragment.value ? fragment.value.length / 18 : 2
		} else if (fragment.type === 'image') {
			totalTimeSeconds += 5
		} else if (fragment.type === 'audio' || fragment.type === 'video') {
			hasDefinedTime = fragment.time !== undefined
			totalTimeSeconds += fragment.time ?? 10
			hasMedia = true
		}
	}
	const minTime = 5

	if (hasDefinedTime) {
		return {
			seconds: Math.floor(Math.max(totalTimeSeconds, minTime)),
			hasMedia,
		}
	}

	const maxTime = 15
	return {
		seconds: Math.floor(Math.min(Math.max(totalTimeSeconds, minTime), maxTime) + 1),
		hasMedia,
	}
}
