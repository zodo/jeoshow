import { describe, it, expect } from 'vitest'
import { startedGame, readyForHitGame } from './helpers/harness'

// ── Wrong-stage no-ops ──

describe('wrong-stage no-ops', () => {
	it('answer-give during round stage is a no-op', () => {
		const g = startedGame()
		expect(g.stageType).toBe('round')
		const stateBefore = g.state

		const result = g.answerGive('p1', 'some answer')

		expect(g.state).toBe(stateBefore)
		expect(result.effects).toEqual([])
	})

	it('answer-give by non-answering player during awaiting-answer is a no-op', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')
		const stateBefore = g.state

		const result = g.answerGive('p2', 'some answer')

		expect(g.state).toBe(stateBefore)
		expect(result.effects).toEqual([])
	})

	it('answer-typing during round stage is a no-op', () => {
		const g = startedGame()
		expect(g.stageType).toBe('round')
		const stateBefore = g.state

		const result = g.answerTyping('p1', 'typing...')

		expect(g.state).toBe(stateBefore)
		expect(result.effects).toEqual([])
	})

	it('appeal-vote during question stage is a no-op', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')
		expect(g.stageType).toBe('question')
		const stateBefore = g.state

		const result = g.appealVote('p1', 'agree')

		expect(g.state).toBe(stateBefore)
		expect(result.effects).toEqual([])
	})

	it('round-skip during question stage is a no-op', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')
		expect(g.stageType).toBe('question')
		const stateBefore = g.state

		const result = g.roundSkip('p1', 'yes')

		expect(g.state).toBe(stateBefore)
		expect(result.effects).toEqual([])
	})

	it('answer-skip during round stage is a no-op', () => {
		const g = startedGame()
		expect(g.stageType).toBe('round')
		const stateBefore = g.state

		const result = g.answerSkip('p1')

		expect(g.state).toBe(stateBefore)
		expect(result.effects).toEqual([])
	})

	it('media-finished during round stage is a no-op', () => {
		const g = startedGame()
		expect(g.stageType).toBe('round')
		const stateBefore = g.state

		const result = g.mediaFinished('p1')

		expect(g.state).toBe(stateBefore)
		expect(result.effects).toEqual([])
	})
})

// ── Stale callbackId dedup ──

describe('stale callbackId dedup', () => {
	it('answer-timeout with stale callbackId is a no-op', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')

		// Mutate callbackId to make the scheduled timeout stale
		;(g.state.stage as any).callbackId = 'stale'
		const stateBefore = g.state

		const result = g.fireScheduled('answer-timeout')

		expect(g.state).toBe(stateBefore)
		expect(g.stageType).toBe('awaiting-answer')
		expect(result.effects).toEqual([])
	})

	it('question-random with stale callbackId is a no-op', () => {
		const g = startedGame()
		expect(g.stageType).toBe('round')

		;(g.state.stage as any).callbackId = 'stale'
		const stateBefore = g.state

		const result = g.apply({
			type: 'server',
			action: { type: 'question-random', callbackId: 'old-callback' },
		})

		expect(g.state).toBe(stateBefore)
		expect(g.stageType).toBe('round')
		expect(result.effects).toEqual([])
	})

	it('round-return with stale callbackId is a no-op', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')
		// After correct answer, answer-show triggers, which leads to 'answer' stage
		expect(g.stageType).toBe('answer')

		;(g.state.stage as any).callbackId = 'stale'
		const stageBefore = g.stageType

		// Manually apply the round-return command with a non-stale callbackId
		// that still won't match because we set it to 'stale'
		const result = g.apply({
			type: 'server',
			action: { type: 'round-return', callbackId: 'not-stale-either' },
		})

		expect(g.stageType).toBe(stageBefore)
		expect(result.effects).toEqual([])
	})

	it('llm-verdict with stale callbackId is a no-op', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')

		// Give a wrong answer that triggers LLM checking
		g.answerGive('p1', 'wrong answer')
		expect(g.stageType).toBe('llm-checking')
		const stateBefore = g.state

		// Send llm-verdict with a made-up callbackId
		const result = g.apply({
			type: 'server',
			action: { type: 'llm-verdict', correct: true, callbackId: 'made-up-id' },
		})

		expect(g.state).toBe(stateBefore)
		expect(g.stageType).toBe('llm-checking')
		expect(result.effects).toEqual([])
	})
})

// ── fire-stage-update ──

describe('fire-stage-update', () => {
	it('is a no-op (stage-updated is auto-broadcast by DO)', () => {
		const g = startedGame()
		expect(g.stageType).toBe('round')
		g.clearEffects()

		const result = g.apply({
			type: 'server',
			action: { type: 'fire-stage-update' },
		})

		// fire-stage-update is now a no-op; the DO auto-broadcasts stage changes
		expect(result.effects).toHaveLength(0)
	})
})
