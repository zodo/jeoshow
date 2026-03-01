import type { PackModel } from 'shared/models/siq'
import { assertNever } from 'shared/utils/assert-never'

export const isCorrect = (correctAnswer: PackModel.Answers, actualAnswer: string): boolean => {
	if (correctAnswer.type === 'regular') {
		const sanitize = (s: string) =>
			s
				.replace(/[^\p{L}\p{N}]+/gu, '')
				.replace('ё', 'е')
				.replace('й', 'и')
				.toLowerCase()

		return correctAnswer.correct.map(sanitize).includes(sanitize(actualAnswer))
	} else if (correctAnswer.type === 'select') {
		return actualAnswer === correctAnswer.correctName
	} else {
		assertNever(correctAnswer)
	}
}
