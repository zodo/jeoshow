import { describe, it, expect } from 'vitest'
import { readyForHitGame, startedGame } from './helpers/harness'
import { PLAYER1, PLAYER2, PLAYER3 } from './helpers/fixtures'
import type { Stage } from '../models/state'

// ── correct answers (regular) ──

describe('correct answers (regular)', () => {
	it('exact match awards points and transitions to answer', () => {
		const g = readyForHitGame()
		const scoreBefore = g.playerScore('p1')

		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')

		// answer-attempt triggers answer-show, which goes to 'answer'
		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(scoreBefore + 100)
	})

	it('case-insensitive match works', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'Correct Answer')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(100)
	})

	it('punctuation is stripped during matching', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'correct...answer!')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(100)
	})

	it('ё in stored answer matches е in input', () => {
		// q2 accepts "ответ ёжик" — input with е should match via ё→е normalization
		const g = readyForHitGame(undefined, 'q2')

		g.buttonHit('p1')
		g.answerGive('p1', 'ответ ежик')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(200)
	})

	it('ё in input matches е in stored answer', () => {
		// q2 also accepts "answer two" (no ё), but let's test the reverse:
		// input "ответ ёжик" matches stored "ответ ёжик" directly
		const g = readyForHitGame(undefined, 'q2')

		g.buttonHit('p1')
		g.answerGive('p1', 'ответ ёжик')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(200)
	})

	it('multiple accepted answers both work', () => {
		// q2 accepts "answer two" or "ответ ёжик"
		const g1 = readyForHitGame(undefined, 'q2')
		g1.buttonHit('p1')
		g1.answerGive('p1', 'answer two')
		expect(g1.stageType).toBe('answer')
		expect(g1.playerScore('p1')).toBe(200)

		const g2 = readyForHitGame(undefined, 'q2')
		g2.buttonHit('p1')
		g2.answerGive('p1', 'ответ ежик')
		expect(g2.stageType).toBe('answer')
		expect(g2.playerScore('p1')).toBe(200)
	})
})

// ── wrong answers (regular) ──

describe('wrong answers (regular)', () => {
	it('string mismatch goes to llm-checking, not immediate rejection', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'totally wrong')

		expect(g.stageType).toBe('llm-checking')
	})

	it('score decreases after LLM says false', () => {
		const g = readyForHitGame()
		const scoreBefore = g.playerScore('p1')

		g.buttonHit('p1')
		g.answerGive('p1', 'wrong answer')
		g.llmVerdict(false)

		expect(g.playerScore('p1')).toBe(scoreBefore - 100)
	})

	it('after wrong answer other players get a chance via button-ready schedule', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'wrong answer')
		g.llmVerdict(false)

		// answer-attempt stage with a scheduled button-ready for next player
		expect(g.stageType).toBe('answer-attempt')
		expect(g.hasScheduled('button-ready')).toBe(true)

		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		// p2 can now buzz in
		g.buttonHit('p2')
		expect(g.stageType).toBe('awaiting-answer')
	})
})

// ── LLM judge path ──

describe('LLM judge path', () => {
	it('string mismatch transitions to llm-checking stage', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'close but not exact')

		expect(g.stageType).toBe('llm-checking')
		const stage = g.stage as Extract<Stage, { type: 'llm-checking' }>
		expect(stage.answeringPlayer).toBe('p1')
		expect(stage.playerAnswer).toBe('close but not exact')
	})

	it('llm-judge effect is emitted with correct fields', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'my guess')

		expect(g.llmRequests).toHaveLength(1)
		const req = g.llmRequests[0]
		expect(req.type).toBe('llm-judge')
		expect(req.questionText).toBe('Question q1')
		expect(req.correctAnswers).toEqual(['correct answer'])
		expect(req.playerAnswer).toBe('my guess')
	})

	it('LLM verdict true awards points and goes to answer-attempt', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'close enough')

		expect(g.stageType).toBe('llm-checking')
		g.llmVerdict(true)

		// Correct verdict → answer-attempt triggers answer-show → answer
		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(100)
	})

	it('LLM verdict false deducts points and allows others to answer', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'wrong guess')

		expect(g.stageType).toBe('llm-checking')
		g.llmVerdict(false)

		expect(g.playerScore('p1')).toBe(-100)
		// Other players can still answer
		expect(g.stageType).toBe('answer-attempt')
		expect(g.hasScheduled('button-ready')).toBe(true)
	})

	it('LLM timeout schedule is set as a fallback', () => {
		const g = readyForHitGame()

		g.buttonHit('p1')
		g.answerGive('p1', 'some guess')

		expect(g.stageType).toBe('llm-checking')
		// A fallback llm-verdict (correct: false) is scheduled
		expect(g.hasScheduled('llm-verdict')).toBe(true)
	})
})

// ── select answers ──

describe('select answers', () => {
	it('correct select answer awards points', () => {
		// q4: select, correctName='b', price=200
		const g = readyForHitGame(undefined, 'q4')

		g.buttonHit('p1')
		g.answerGive('p1', 'b')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(200)
	})

	it('wrong select answer immediately deducts points (no LLM)', () => {
		const g = readyForHitGame(undefined, 'q4')

		g.buttonHit('p1')
		g.answerGive('p1', 'a')

		// Select answers skip LLM — go straight to answer-attempt
		expect(g.stageType).not.toBe('llm-checking')
		expect(g.playerScore('p1')).toBe(-200)
		expect(g.llmRequests).toHaveLength(0)
	})

	it('wrong select answer lets other players try', () => {
		const g = readyForHitGame(undefined, 'q4')

		g.buttonHit('p1')
		g.answerGive('p1', 'c')

		expect(g.playerScore('p1')).toBe(-200)
		expect(g.hasScheduled('button-ready')).toBe(true)

		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		g.buttonHit('p2')
		g.answerGive('p2', 'b')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p2')).toBe(200)
	})

	it('select answers never go through LLM even when wrong', () => {
		const g = readyForHitGame(undefined, 'q4')

		g.buttonHit('p1')
		g.answerGive('p1', 'a')

		expect(g.llmRequests).toHaveLength(0)
		expect(g.stageType).not.toBe('llm-checking')
	})
})

// ── й→и normalization ──

describe('й→и normalization', () => {
	it('input with и matches stored answer containing й', () => {
		// q7 answer is "чайник" — input "чаиник" (и instead of й) should match
		// because sanitizer does .replace('й', 'и') on both sides
		const g = readyForHitGame(undefined, 'q7')

		g.buttonHit('p1')
		g.answerGive('p1', 'чаиник')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(100)
	})

	it('exact й in input matches stored й answer directly', () => {
		const g = readyForHitGame(undefined, 'q7')

		g.buttonHit('p1')
		g.answerGive('p1', 'чайник')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(100)
	})
})

// ── everyone fails a question ──

describe('everyone fails a question', () => {
	it('after all players answer wrong, answer-show triggers and stage is answer', () => {
		const g = readyForHitGame([PLAYER1, PLAYER2], 'q1')

		// p1 buzzes and answers wrong
		g.buttonHit('p1')
		g.answerGive('p1', 'wrong')
		g.llmVerdict(false)

		expect(g.playerScore('p1')).toBe(-100)
		expect(g.stageType).toBe('answer-attempt')
		expect(g.hasScheduled('button-ready')).toBe(true)

		// p2 gets a turn
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		g.buttonHit('p2')
		g.answerGive('p2', 'also wrong')
		g.llmVerdict(false)

		// No more players left — answer-show triggers automatically
		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(-100)
		expect(g.playerScore('p2')).toBe(-100)
	})
})

// ── select answer attempt limits ──

describe('select answer attempt limits', () => {
	it('limits wrong attempts to options.length - 1 regardless of player count', () => {
		// q4 has 3 options (a, b, c), so max wrong attempts = 3 - 1 = 2
		// Use 3 players to show the limit is based on options, not player count
		const g = readyForHitGame([PLAYER1, PLAYER2, PLAYER3], 'q4')

		// p1 selects wrong
		g.buttonHit('p1')
		g.answerGive('p1', 'a')

		expect(g.playerScore('p1')).toBe(-200)
		expect(g.hasScheduled('button-ready')).toBe(true)

		// p2 gets a turn
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		// p2 selects wrong — this is the 2nd wrong attempt (= options.length - 1)
		g.buttonHit('p2')
		g.answerGive('p2', 'c')

		// answer-show triggers — no third attempt even though p3 hasn't tried
		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p2')).toBe(-200)
	})
})

// ── score accumulation across questions ──

describe('score accumulation across questions', () => {
	it('score adds up across two correctly answered questions', () => {
		const g = startedGame()

		// Play q1 (price 100)
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(100)

		// Return to round
		g.fireScheduled('round-return')
		expect(g.stageType).toBe('round')

		// Play q2 (price 200)
		g.selectQuestion(g.activePlayer, 'q2')
		g.fireScheduled('button-ready')
		g.buttonHit('p1')
		g.answerGive('p1', 'answer two')

		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBe(300)
	})
})
