import type { Player } from 'shared/models/models'
import type { PackModel } from 'shared/models/siq'
import type { GameState } from '../../models/state'
import type { CommandContext } from '../../models/state-machine'

// ── Players ──

export const makePlayer = (overrides: Partial<Player> & { id: string }): Player => ({
	name: overrides.id,
	avatarUrl: undefined,
	score: 0,
	disconnected: false,
	answerAttemts: 0,
	ping: 0,
	...overrides,
})

export const PLAYER1 = makePlayer({ id: 'p1', name: 'Alice' })
export const PLAYER2 = makePlayer({ id: 'p2', name: 'Bob' })
export const PLAYER3 = makePlayer({ id: 'p3', name: 'Charlie' })

// ── Pack ──

const textFragment = (value: string): PackModel.Text => ({ type: 'text', value })

const makeQuestion = (
	id: string,
	price: number,
	answers: PackModel.Answers
): PackModel.Question => ({
	id,
	price,
	fragments: [[textFragment(`Question ${id}`)]],
	answers,
})

const regularAnswer = (correct: string[], incorrect?: string[]): PackModel.Answers => ({
	type: 'regular',
	correct,
	incorrect,
	content: [[textFragment(`Answer`)]],
})

const selectAnswer = (
	options: { name: string; text: string }[],
	correctName: string
): PackModel.Answers => ({
	type: 'select',
	options,
	correctName,
})

export const TEST_PACK: PackModel.Pack = {
	name: 'Test Pack',
	rounds: [
		{
			id: 'r1',
			name: 'Round 1',
			type: 'Standard',
			themes: [
				{
					name: 'Theme A',
					questions: [
						makeQuestion('q1', 100, regularAnswer(['correct answer'])),
						makeQuestion('q2', 200, regularAnswer(['answer two', 'ответ ёжик'])),
						makeQuestion('q7', 100, regularAnswer(['чайник'])),
					],
				},
				{
					name: 'Theme B',
					questions: [
						makeQuestion('q3', 100, regularAnswer(['third'], ['wrong third'])),
						makeQuestion(
							'q4',
							200,
							selectAnswer(
								[
									{ name: 'a', text: 'Option A' },
									{ name: 'b', text: 'Option B' },
									{ name: 'c', text: 'Option C' },
								],
								'b'
							)
						),
					],
				},
			],
		},
		{
			id: 'r2',
			name: 'Round 2',
			type: 'Standard',
			themes: [
				{
					name: 'Theme C',
					questions: [
						makeQuestion('q5', 300, regularAnswer(['five'])),
						makeQuestion('q6', 400, regularAnswer(['six'])),
					],
				},
			],
		},
	],
}

// ── Context ──

let callCounter = 0

/** Deterministic random: returns 0.1, 0.2, 0.3, ... cycling through 0.1–0.9 */
export const deterministicRandom = (): number => {
	callCounter = (callCounter % 9) + 1
	return callCounter / 10
}

export const resetRandom = () => {
	callCounter = 0
}

export const makeContext = (overrides?: Partial<CommandContext>): CommandContext => ({
	pack: TEST_PACK,
	mediaMapping: {},
	now: 1000000,
	random: deterministicRandom,
	...overrides,
})

// ── State ──

export const makeInitialState = (players: Player[] = [PLAYER1, PLAYER2]): GameState => ({
	players,
	stage: { type: 'before-start' },
	gameMode: 'classic',
})
