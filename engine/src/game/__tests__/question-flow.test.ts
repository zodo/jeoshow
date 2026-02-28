import { describe, it, expect } from 'vitest'
import { startedGame, readyForHitGame } from './helpers/harness'
import type { Stage } from '../models/state'

// ── question-select ──

describe('question-select', () => {
	it('only the active player can select a question', () => {
		const g = startedGame()
		const active = g.activePlayer
		const other = active === 'p1' ? 'p2' : 'p1'

		g.selectQuestion(other, 'q1')
		// Non-active player's select is ignored — stage stays 'round'
		expect(g.stageType).toBe('round')

		g.selectQuestion(active, 'q1')
		expect(g.stageType).toBe('question')
	})

	it('transitions to question stage with correct questionId', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q2')

		expect(g.stageType).toBe('question')
		const stage = g.stage as Extract<Stage, { type: 'question' }>
		expect(stage.questionId).toBe('q2')
	})

	it('already taken questions cannot be selected again', () => {
		const g = startedGame()
		const active = g.activePlayer

		// Play through q1 to mark it taken
		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit(active)
		g.answerGive(active, 'correct answer')
		g.fireScheduled('round-return')

		expect(g.stageType).toBe('round')
		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.takenQuestions).toContain('q1')

		// Try to select q1 again — should be ignored
		g.selectQuestion(g.activePlayer, 'q1')
		expect(g.stageType).toBe('round')
	})

	it('schedules button-ready timer', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')

		expect(g.stageType).toBe('question')
		expect(g.hasScheduled('button-ready')).toBe(true)
	})
})

// ── button-ready (server) ──

describe('button-ready', () => {
	it('transitions from question to ready-for-hit', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')

		expect(g.stageType).toBe('question')
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')
	})

	it('schedules button-hit-timeout', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		expect(g.hasScheduled('button-hit-timeout')).toBe(true)
	})

	it('with low ping, randomizeHits is false', () => {
		const g = startedGame()
		// Both players have default ping of 0, well under 300ms threshold
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		const stage = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage.randomizeHits).toBe(false)
	})
})

// ── button-hit-timeout ──

describe('button-hit-timeout', () => {
	it('when no one hits, timeout triggers answer-show and transitions to answer', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		expect(g.stageType).toBe('ready-for-hit')
		expect(g.hasScheduled('button-hit-timeout')).toBe(true)

		g.fireScheduled('button-hit-timeout')
		// button-hit-timeout triggers answer-show, which transitions to 'answer'
		expect(g.stageType).toBe('answer')
	})

	it('stale callbackId is ignored', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		expect(g.stageType).toBe('ready-for-hit')

		// Corrupt the callbackId so the scheduled timeout becomes stale
		;(g.state.stage as Extract<Stage, { type: 'ready-for-hit' }>).callbackId = 'stale-id'

		g.fireScheduled('button-hit-timeout')
		// Stage should remain ready-for-hit because the stale callback was ignored
		expect(g.stageType).toBe('ready-for-hit')
	})
})

// ── question-random timeout ──

describe('question-random timeout', () => {
	it('auto-selects a question when active player does not select in time', () => {
		const g = startedGame()

		// startedGame clears effects, but game-start schedules question-random.
		// We need to re-trigger the round stage to get the schedule.
		// Instead, play through a question and use the round-return's question-random.
		const active = g.activePlayer
		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit(active)
		g.answerGive(active, 'correct answer')
		g.fireScheduled('round-return')

		expect(g.stageType).toBe('round')
		expect(g.hasScheduled('question-random')).toBe(true)

		g.fireScheduled('question-random')
		// question-random triggers question-select, which transitions to 'question'
		expect(g.stageType).toBe('question')

		const stage = g.stage as Extract<Stage, { type: 'question' }>
		// The auto-selected question should be one of the remaining r1 questions
		expect(['q2', 'q3', 'q4', 'q7']).toContain(stage.questionId)
	})
})

// ── answer-timeout ──

describe('answer-timeout', () => {
	it('auto-submits a wrong answer when player does not answer in time', () => {
		const g = startedGame()
		const active = g.activePlayer
		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit('p1')

		expect(g.stageType).toBe('awaiting-answer')
		expect(g.hasScheduled('answer-timeout')).toBe(true)

		const scoreBefore = g.playerScore('p1')
		g.fireScheduled('answer-timeout')

		// answer-timeout triggers answer-give with "¯_(ツ)_/¯" which is wrong.
		// For regular answers, the string mismatch goes to the LLM path (llm-checking),
		// but we have no LLM response yet. Let's resolve it as incorrect via llm-verdict.
		expect(g.stageType).toBe('llm-checking')
		g.llmVerdict(false)

		// After incorrect verdict, score should decrease by question price (100)
		expect(g.playerScore('p1')).toBe(scoreBefore - 100)
	})
})

// ── round return after answer ──

describe('round return after answer', () => {
	it('goes back to round stage after answer', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')

		// Correct answer triggers answer-show -> answer stage
		expect(g.stageType).toBe('answer')
		expect(g.hasScheduled('round-return')).toBe(true)

		g.fireScheduled('round-return')
		expect(g.stageType).toBe('round')
	})

	it('takenQuestions grows by one after completing a question', () => {
		const g = startedGame()
		const active = g.activePlayer

		const stageBefore = g.stage as Extract<Stage, { type: 'round' }>
		const takenBefore = stageBefore.takenQuestions.length

		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit(active)
		g.answerGive(active, 'correct answer')
		g.fireScheduled('round-return')

		expect(g.stageType).toBe('round')
		const stageAfter = g.stage as Extract<Stage, { type: 'round' }>
		expect(stageAfter.takenQuestions.length).toBe(takenBefore + 1)
		expect(stageAfter.takenQuestions).toContain('q1')
	})
})
