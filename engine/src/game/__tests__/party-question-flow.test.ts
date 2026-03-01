import { describe, expect, it } from 'vitest'
import { PLAYER1, PLAYER2, PLAYER3, makePlayer } from './helpers/fixtures'
import { partyQuestionGame, startedPartyGame } from './helpers/harness'
import type { Stage } from '../models/state'

describe('party mode: question flow', () => {
	it('game-start with party mode sets gameMode', () => {
		const g = startedPartyGame()
		expect(g.state.gameMode).toBe('party')
		expect(g.state.jackpot).toBe(0)
		expect(g.stageType).toBe('round')
	})

	it('question select creates party-question stage', () => {
		const g = startedPartyGame()
		g.selectQuestion(g.activePlayer, 'q1')
		expect(g.stageType).toBe('party-question')
		const stage = g.stage as Extract<Stage, { type: 'party-question' }>
		expect(stage.questionId).toBe('q1')
		expect(stage.submissions).toEqual([])
		expect(stage.answerTimeSeconds).toBeGreaterThan(15)
	})

	it('schedules party-answer-timeout', () => {
		const g = startedPartyGame()
		g.selectQuestion(g.activePlayer, 'q1')
		expect(g.hasScheduled('party-answer-timeout')).toBe(true)
	})

	it('player submits answer — recorded in submissions', () => {
		const g = partyQuestionGame()
		g.partyAnswer('p1', 'correct answer')
		const stage = g.stage as Extract<Stage, { type: 'party-question' }>
		expect(stage.submissions).toHaveLength(1)
		expect(stage.submissions[0].playerId).toBe('p1')
		expect(stage.submissions[0].answer).toBe('correct answer')
		expect(stage.submissions[0].passed).toBe(false)
	})

	it('party-submission event is broadcast', () => {
		const g = partyQuestionGame()
		g.partyAnswer('p1', 'test')
		const submissionEvent = g.broadcasts.find(
			(b) => b.type === 'client-broadcast' && b.event.type === 'party-submission'
		)
		expect(submissionEvent).toBeDefined()
	})

	it('player passes — recorded as pass', () => {
		const g = partyQuestionGame()
		g.partyPass('p1')
		const stage = g.stage as Extract<Stage, { type: 'party-question' }>
		expect(stage.submissions).toHaveLength(1)
		expect(stage.submissions[0].passed).toBe(true)
	})

	it('duplicate submission from same player is ignored', () => {
		const g = partyQuestionGame()
		g.partyAnswer('p1', 'first')
		g.partyAnswer('p1', 'second')
		const stage = g.stage as Extract<Stage, { type: 'party-question' }>
		expect(stage.submissions).toHaveLength(1)
		expect(stage.submissions[0].answer).toBe('first')
	})

	it('all players submit → triggers timeout early → transitions to party-checking', () => {
		const g = partyQuestionGame()
		g.partyAnswer('p1', 'correct answer')
		g.partyAnswer('p2', 'wrong')
		// After all submitted, should trigger party-answer-timeout automatically
		expect(g.stageType).toBe('party-checking')
	})

	it('timer expiry transitions to party-checking', () => {
		const g = partyQuestionGame()
		g.partyAnswer('p1', 'test')
		// p2 hasn't submitted, fire timeout
		g.fireScheduled('party-answer-timeout')
		expect(g.stageType).toBe('party-checking')
	})

	it('confidence bet is stored in submission', () => {
		const g = partyQuestionGame()
		g.partyAnswer('p1', 'test', true)
		const stage = g.stage as Extract<Stage, { type: 'party-question' }>
		expect(stage.submissions[0].confidenceBet).toBe(true)
	})
})

describe('party mode: 3 players', () => {
	const players = [PLAYER1, PLAYER2, PLAYER3]

	it('needs all 3 to submit before auto-triggering', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'test')
		g.partyAnswer('p2', 'test')
		expect(g.stageType).toBe('party-question')
		g.partyAnswer('p3', 'test')
		// Now all submitted → should transition
		expect(g.stageType).not.toBe('party-question')
	})
})
