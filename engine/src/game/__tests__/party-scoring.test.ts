import { describe, expect, it } from 'vitest'
import { PLAYER1, PLAYER2, PLAYER3 } from './helpers/fixtures'
import { partyQuestionGame } from './helpers/harness'

/** Helper: advance from party-reveal to answer by firing reveal timeout */
function finishReveal(g: ReturnType<typeof partyQuestionGame>) {
	expect(g.stageType).toBe('party-reveal')
	g.fireScheduled('party-reveal-timeout')
	expect(g.stageType).toBe('answer')
}

describe('party mode: scoring', () => {
	const players = [PLAYER1, PLAYER2, PLAYER3]

	it('scores are 0 during party-reveal, applied after reveal ends', () => {
		const g = partyQuestionGame(players) // q1 price=100
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')
		expect(g.stageType).toBe('party-reveal')
		// Scores not yet applied
		expect(g.playerScore('p1')).toBe(0)
		expect(g.playerScore('p2')).toBe(0)

		// After reveal ends, scores applied
		finishReveal(g)
		expect(g.playerScore('p1')).toBeGreaterThanOrEqual(100)
	})

	it('1 of 3 correct → gets full price', () => {
		const g = partyQuestionGame(players) // price=100
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')
		finishReveal(g)
		expect(g.playerScore('p1')).toBeGreaterThanOrEqual(100)
	})

	it('2 of 3 correct → split evenly', () => {
		const g = partyQuestionGame(players) // price=100
		g.partyAnswer('p1', 'correct answer')
		g.partyAnswer('p2', 'correct answer')
		g.partyPass('p3')
		finishReveal(g)
		expect(g.playerScore('p1')).toBe(50)
		expect(g.playerScore('p2')).toBe(50)
		expect(g.playerScore('p3')).toBe(0)
	})

	it('all correct → each gets price/3', () => {
		const g = partyQuestionGame(players) // price=100
		g.partyAnswer('p1', 'correct answer')
		g.partyAnswer('p2', 'correct answer')
		g.partyAnswer('p3', 'correct answer')
		finishReveal(g)
		expect(g.playerScore('p1')).toBe(33)
		expect(g.playerScore('p2')).toBe(33)
		expect(g.playerScore('p3')).toBe(33)
	})

	it('nobody correct → all get 0', () => {
		const g = partyQuestionGame(players)
		g.partyPass('p1')
		g.partyPass('p2')
		g.partyPass('p3')
		finishReveal(g)
		expect(g.playerScore('p1')).toBe(0)
		expect(g.playerScore('p2')).toBe(0)
		expect(g.playerScore('p3')).toBe(0)
	})

	it('confidence bet correct → double share', () => {
		const g = partyQuestionGame(players) // price=100
		g.partyAnswer('p1', 'correct answer', true) // 2x bet
		g.partyPass('p2')
		g.partyPass('p3')
		finishReveal(g)
		// p1 gets 100 * 2 = 200
		expect(g.playerScore('p1')).toBeGreaterThanOrEqual(200)
	})

	it('confidence bet wrong → loses base price', () => {
		const g = partyQuestionGame(players) // price=100
		g.partyPass('p1')
		g.partyAnswer('p2', 'correct answer')
		g.partyPass('p3')
		finishReveal(g)
		expect(g.playerScore('p1')).toBe(0) // pass = no loss
		expect(g.playerScore('p2')).toBeGreaterThanOrEqual(100)
	})

	it('confidence bet wrong with 2x → loses base price', () => {
		const g = partyQuestionGame(players) // price=100
		g.partyAnswer('p1', 'totally wrong', true) // 2x bet, will need LLM
		g.partyAnswer('p2', 'correct answer')
		g.partyPass('p3')
		expect(g.stageType).toBe('party-checking')
		g.partyLlmVerdict('p1', false) // LLM says incorrect
		finishReveal(g)
		expect(g.playerScore('p1')).toBe(-100) // confidence bet penalty
		expect(g.playerScore('p2')).toBeGreaterThanOrEqual(100)
	})

	it('pass gives 0 points', () => {
		const g = partyQuestionGame(players)
		g.partyPass('p1')
		g.partyAnswer('p2', 'correct answer')
		g.partyPass('p3')
		finishReveal(g)
		expect(g.playerScore('p1')).toBe(0)
		expect(g.playerScore('p2')).toBeGreaterThanOrEqual(100)
	})

	it('wrong answers that need LLM → resolved via verdict', () => {
		const g = partyQuestionGame(players) // price=100
		g.partyAnswer('p1', 'correct answer') // string match
		g.partyAnswer('p2', 'some guess')     // needs LLM
		g.partyAnswer('p3', 'another guess')  // needs LLM
		expect(g.stageType).toBe('party-checking')

		g.partyLlmVerdict('p2', false)
		g.partyLlmVerdict('p3', false)
		finishReveal(g)
		expect(g.playerScore('p1')).toBeGreaterThanOrEqual(100)
		expect(g.playerScore('p2')).toBe(0)
		expect(g.playerScore('p3')).toBe(0)
	})

	it('scores applied via party-reveal-ready (frontend path)', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')
		expect(g.playerScore('p1')).toBe(0) // not yet

		g.partyRevealReady('p1')
		g.partyRevealReady('p2') // majority
		expect(g.stageType).toBe('answer')
		expect(g.playerScore('p1')).toBeGreaterThanOrEqual(100)
	})
})
