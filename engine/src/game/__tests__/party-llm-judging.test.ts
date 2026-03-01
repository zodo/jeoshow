import { describe, expect, it } from 'vitest'
import { PLAYER1, PLAYER2, PLAYER3 } from './helpers/fixtures'
import { partyQuestionGame } from './helpers/harness'

describe('party mode: LLM judging', () => {
	const players = [PLAYER1, PLAYER2, PLAYER3]

	it('string match succeeds → no LLM call needed', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyAnswer('p2', 'correct answer')
		g.partyAnswer('p3', 'correct answer')
		// All matched by string → no LLM needed
		expect(g.llmBatchRequests).toHaveLength(0)
		expect(g.stageType).toBe('party-reveal')
	})

	it('string match fails → emits llm-judge-batch effect', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer') // string match
		g.partyAnswer('p2', 'maybe correct?') // no match → needs LLM
		g.partyAnswer('p3', 'totally wrong')  // no match → needs LLM

		expect(g.stageType).toBe('party-checking')
		expect(g.llmBatchRequests).toHaveLength(1)
		expect(g.llmBatchRequests[0].entries).toHaveLength(2) // p2 and p3
	})

	it('individual LLM verdicts decrement pending count', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyAnswer('p2', 'maybe correct?')
		g.partyAnswer('p3', 'also maybe?')
		expect(g.stageType).toBe('party-checking')

		g.partyLlmVerdict('p2', true)
		// Still checking — one more pending
		expect(g.stageType).toBe('party-checking')

		g.partyLlmVerdict('p3', false)
		// All verdicts in → should transition to party-reveal
		expect(g.stageType).toBe('party-reveal')
	})

	it('LLM correct verdict gives player credit', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')  // string match → correct
		g.partyAnswer('p2', 'synonym answer')   // LLM needed
		g.partyAnswer('p3', 'wrong')            // LLM needed

		g.partyLlmVerdict('p2', true)  // LLM says correct
		g.partyLlmVerdict('p3', false) // LLM says incorrect
		expect(g.stageType).toBe('party-reveal')

		g.fireScheduled('party-reveal-timeout')
		// p1 and p2 correct → split pot (100/2 = 50 each, first may get early bonus)
		expect(g.playerScore('p1')).toBeGreaterThanOrEqual(50)
		expect(g.playerScore('p2')).toBeGreaterThanOrEqual(50)
		expect(g.playerScore('p3')).toBe(0)
	})

	it('timeout fires before all verdicts → unresolved assumed incorrect', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyAnswer('p2', 'maybe?')
		g.partyAnswer('p3', 'also maybe?')
		expect(g.stageType).toBe('party-checking')

		// Don't send LLM verdicts — fire the timeout instead
		g.fireScheduled('party-verdicts-ready')
		// Should transition to party-reveal with unresolved treated as incorrect
		expect(g.stageType).toBe('party-reveal')

		g.fireScheduled('party-reveal-timeout')
		expect(g.playerScore('p1')).toBe(100) // only correct player, gets full pot
		expect(g.playerScore('p2')).toBe(0)
		expect(g.playerScore('p3')).toBe(0)
	})

	it('schedules fallback timeout for LLM checking', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyAnswer('p2', 'maybe?')
		g.partyAnswer('p3', 'also?')
		expect(g.hasScheduled('party-verdicts-ready')).toBe(true)
	})
})
