import { describe, it, expect } from 'vitest'
import { startedGame, readyForHitGame } from './helpers/harness'
import { PLAYER1, PLAYER2, PLAYER3, makePlayer } from './helpers/fixtures'
import type { Stage } from '../models/state'

const THREE_PLAYERS = [PLAYER1, PLAYER2, PLAYER3]

/** Complete a question: select -> button-ready -> hit -> correct answer -> round-return. */
const completeQuestion = (
	g: ReturnType<typeof startedGame>,
	questionId: string,
	correctAnswer: string
) => {
	const active = g.activePlayer
	g.selectQuestion(active, questionId)
	g.fireScheduled('button-ready')
	g.buttonHit(active)
	g.answerGive(active, correctAnswer)
	g.fireScheduled('round-return')
}

// ── Round skip voting ──

describe('round skip voting', () => {
	it('first vote starts skipRoundVoting with the vote recorded', () => {
		const g = startedGame()

		g.roundSkip('p1', 'yes')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.skipRoundVoting).toBeDefined()
		expect(stage.skipRoundVoting!.yes).toContain('p1')
		expect(stage.skipRoundVoting!.no).toEqual([])
	})

	it('first vote schedules round-return timeout', () => {
		const g = startedGame()

		g.roundSkip('p1', 'yes')

		expect(g.hasScheduled('round-return')).toBe(true)
	})

	it('second player can vote differently', () => {
		const g = startedGame()

		g.roundSkip('p1', 'yes')
		g.roundSkip('p2', 'no')

		// Vote resolves immediately with 2 players (all voted).
		// yes=1, no=1 -> tie -> no wins -> voting cleared
		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.skipRoundVoting).toBeUndefined()
	})

	it("player can't vote twice (ignored)", () => {
		const g = startedGame(THREE_PLAYERS)

		g.roundSkip('p1', 'yes')

		const stageBefore = g.stage as Extract<Stage, { type: 'round' }>
		const yesCountBefore = stageBefore.skipRoundVoting!.yes.length

		g.roundSkip('p1', 'no')

		const stageAfter = g.stage as Extract<Stage, { type: 'round' }>
		expect(stageAfter.skipRoundVoting!.yes.length).toBe(yesCountBefore)
		expect(stageAfter.skipRoundVoting!.no).not.toContain('p1')
	})

	it("can't start skip voting during appealVoting", () => {
		const g = startedGame()

		// Manually set appealVoting on the stage
		;(g.state.stage as any).appealVoting = {
			questionId: 'q1',
			answer: 'wrong',
			playerId: 'p1',
			agree: ['p1'],
			disagree: [],
			timeoutSeconds: 10,
		}

		const stageBefore = g.stage
		g.roundSkip('p2', 'yes')
		// Should be ignored — state unchanged
		expect(g.stage).toEqual(stageBefore)
	})
})

// ── Round skip resolution ──

describe('round skip resolution', () => {
	it('2-player game: yes+yes -> skip succeeds, moves to next round (r2)', () => {
		const g = startedGame()

		g.roundSkip('p1', 'yes')
		g.roundSkip('p2', 'yes')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.type).toBe('round')
		expect(stage.roundId).toBe('r2')
		expect(stage.takenQuestions).toEqual([])
		expect(stage.skipRoundVoting).toBeUndefined()
	})

	it('2-player game: yes+no -> skip fails (tie = no wins), voting cleared', () => {
		const g = startedGame()

		g.roundSkip('p1', 'yes')
		g.roundSkip('p2', 'no')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.type).toBe('round')
		expect(stage.roundId).toBe('r1')
		expect(stage.skipRoundVoting).toBeUndefined()
	})

	it('3-player game: 2 yes + 1 no -> skip succeeds', () => {
		const g = startedGame(THREE_PLAYERS)

		g.roundSkip('p1', 'yes')
		g.roundSkip('p2', 'yes')
		g.roundSkip('p3', 'no')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.type).toBe('round')
		expect(stage.roundId).toBe('r2')
		expect(stage.takenQuestions).toEqual([])
	})

	it('skip from last round -> after-finish', () => {
		const g = startedGame()

		// Skip r1 to get to r2
		g.roundSkip('p1', 'yes')
		g.roundSkip('p2', 'yes')
		expect((g.stage as Extract<Stage, { type: 'round' }>).roundId).toBe('r2')

		// Now skip r2 (last round)
		g.roundSkip('p1', 'yes')
		g.roundSkip('p2', 'yes')

		expect(g.stageType).toBe('after-finish')
	})
})

// ── Round transitions ──

describe('round transitions', () => {
	it('after completing all questions in r1, round-return advances to r2', () => {
		const g = startedGame()

		// r1 has 5 questions: q1, q2, q7, q3, q4
		completeQuestion(g, 'q1', 'correct answer')
		completeQuestion(g, 'q2', 'answer two')
		completeQuestion(g, 'q7', 'чайник')
		completeQuestion(g, 'q3', 'third')
		completeQuestion(g, 'q4', 'b')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.type).toBe('round')
		expect(stage.roundId).toBe('r2')
		expect(stage.takenQuestions).toEqual([])
	})

	it('after completing all questions in r2 (last round), stage becomes after-finish', () => {
		const g = startedGame()

		// Complete all r1 questions
		completeQuestion(g, 'q1', 'correct answer')
		completeQuestion(g, 'q2', 'answer two')
		completeQuestion(g, 'q7', 'чайник')
		completeQuestion(g, 'q3', 'third')
		completeQuestion(g, 'q4', 'b')

		expect((g.stage as Extract<Stage, { type: 'round' }>).roundId).toBe('r2')

		// Complete all r2 questions: q5, q6
		completeQuestion(g, 'q5', 'five')
		completeQuestion(g, 'q6', 'six')

		expect(g.stageType).toBe('after-finish')
	})
})

// ── Question random ──

describe('question-random', () => {
	it('when active player does not select in time, question-random auto-picks an available question', () => {
		const g = startedGame()

		// Complete q1 so round-return schedules a fresh question-random
		completeQuestion(g, 'q1', 'correct answer')
		expect(g.stageType).toBe('round')
		expect(g.hasScheduled('question-random')).toBe(true)

		// Fire question-random to simulate selection timeout
		g.fireScheduled('question-random')

		// Should have auto-selected a question — stage transitions past 'round'
		expect(g.stageType).toBe('question')
	})

	it('auto-selected question is not in takenQuestions', () => {
		const g = startedGame()

		// Complete q1 first
		completeQuestion(g, 'q1', 'correct answer')

		const stageBefore = g.stage as Extract<Stage, { type: 'round' }>
		expect(stageBefore.takenQuestions).toContain('q1')

		// Fire question-random — should pick from q2, q3, q4, q7 (not q1)
		g.fireScheduled('question-random')

		const stage = g.stage as Extract<Stage, { type: 'question' }>
		expect(stage.type).toBe('question')
		expect(stage.questionId).not.toBe('q1')
		expect(stageBefore.takenQuestions).not.toContain(stage.questionId)
	})
})
