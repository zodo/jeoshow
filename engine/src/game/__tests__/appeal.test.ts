import { describe, it, expect } from 'vitest'
import { readyForHitGame } from './helpers/harness'
import { PLAYER1, PLAYER2, PLAYER3, makePlayer } from './helpers/fixtures'
import type { Stage } from '../models/state'
import { toSnapshot } from '../state-utils'
import { makeContext } from './helpers/fixtures'

const THREE_PLAYERS = [PLAYER1, PLAYER2, PLAYER3]

/**
 * Get to 'round' stage with previousAnswers populated (all 3 players answered wrong).
 * Flow: ready-for-hit -> all 3 wrong -> answer-show -> answer -> round-return -> round
 */
const roundWithWrongAnswers = () => {
	const g = readyForHitGame(THREE_PLAYERS)

	g.buttonHit('p1')
	g.answerGive('p1', 'wrong')
	g.llmVerdict(false)
	g.fireScheduled('button-ready')

	g.buttonHit('p2')
	g.answerGive('p2', 'also wrong')
	g.llmVerdict(false)
	g.fireScheduled('button-ready')

	g.buttonHit('p3')
	g.answerGive('p3', 'still wrong')
	g.llmVerdict(false)
	// All 3 failed -> triggers answer-show -> answer stage
	expect(g.stageType).toBe('answer')

	g.fireScheduled('round-return')
	expect(g.stageType).toBe('round')

	g.clearEffects()
	return g
}

// ── Starting an appeal ──

describe('starting an appeal', () => {
	it('player who answered wrong can start appeal', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.appealVoting).toBeDefined()
		expect(stage.appealVoting!.playerId).toBe('p1')
		expect(stage.appealVoting!.agree).toContain('p1')
		expect(stage.appealVoting!.disagree).toEqual([])
	})

	it('appeal voting includes the player answer text', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.appealVoting!.answer).toBe('wrong')
	})

	it('player who did not answer wrong cannot start appeal', () => {
		const g = readyForHitGame(THREE_PLAYERS)

		// Only p1 answers wrong
		g.buttonHit('p1')
		g.answerGive('p1', 'wrong')
		g.llmVerdict(false)
		g.fireScheduled('button-ready')

		// p2 answers correctly -> answer-show -> answer
		g.buttonHit('p2')
		g.answerGive('p2', 'correct answer')
		expect(g.stageType).toBe('answer')
		g.fireScheduled('round-return')
		expect(g.stageType).toBe('round')

		// p3 never answered -- cannot appeal
		const stageBefore = g.stage
		g.appealVote('p3', 'agree')
		expect(g.stage).toEqual(stageBefore)
	})

	it('adds appealer to triedToAppeal', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.previousAnswers.triedToAppeal).toContain('p1')
	})
})

// ── Appeal voting ──

describe('appeal voting', () => {
	it('other players can vote agree or disagree', () => {
		const g = roundWithWrongAnswers()
		g.appealVote('p1', 'agree') // starts appeal

		g.appealVote('p2', 'disagree')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.appealVoting!.agree).toEqual(['p1'])
		expect(stage.appealVoting!.disagree).toEqual(['p2'])
	})

	it('the appealing player cannot vote again', () => {
		const g = roundWithWrongAnswers()
		g.appealVote('p1', 'agree') // starts appeal

		const stageBefore = g.stage as Extract<Stage, { type: 'round' }>
		const agreeCountBefore = stageBefore.appealVoting!.agree.length

		g.appealVote('p1', 'agree')

		const stageAfter = g.stage as Extract<Stage, { type: 'round' }>
		expect(stageAfter.appealVoting!.agree.length).toBe(agreeCountBefore)
	})
})

// ── Appeal approved ──
// With 3 players: votesLimit = ceil(3/2) = 2, approval needs > 2 = 3 agree votes.
// Appealer auto-agrees (1), so both other players must also agree.

describe('appeal approved', () => {
	it('approved when >50% of players agree (all 3 agree)', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree') // starts appeal, p1 auto-agrees (1)
		g.appealVote('p2', 'agree') // (2)
		g.appealVote('p3', 'agree') // (3) -> 3 > 2 -> approved

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.appealResolution).toBe('approved')
	})

	it('reverses scores on approval: appealer gets +2x, others get reversal', () => {
		const g = roundWithWrongAnswers()
		// After wrong answers: each player lost 100 pts
		expect(g.playerScore('p1')).toBe(-100)
		expect(g.playerScore('p2')).toBe(-100)
		expect(g.playerScore('p3')).toBe(-100)

		g.appealVote('p1', 'agree')
		g.appealVote('p2', 'agree')
		g.appealVote('p3', 'agree') // approved

		// p1 (appealer): scoreDiff was -100, reversed *2 -> +200 -> net 100
		expect(g.playerScore('p1')).toBe(100)
		// p2: scoreDiff was -100, reversed *1 -> +100 -> net 0
		expect(g.playerScore('p2')).toBe(0)
		// p3: scoreDiff was -100, reversed *1 -> +100 -> net 0
		expect(g.playerScore('p3')).toBe(0)
	})

	it('sets activePlayer to the appealer', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree')
		g.appealVote('p2', 'agree')
		g.appealVote('p3', 'agree')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.activePlayer).toBe('p1')
	})

	it('schedules round-return after approval', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree')
		g.appealVote('p2', 'agree')
		g.appealVote('p3', 'agree')

		expect(g.hasScheduled('round-return')).toBe(true)
	})

	it('clears previousAnswers on approval', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree')
		g.appealVote('p2', 'agree')
		g.appealVote('p3', 'agree')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.previousAnswers.answers).toEqual([])
		expect(stage.previousAnswers.triedToAppeal).toEqual([])
	})
})

// ── Appeal rejected ──
// With 3 players: votesLimit = ceil(3/2) = 2, rejection needs >= 2 disagree votes.

describe('appeal rejected', () => {
	it('rejected when >=50% of players disagree (2 out of 3)', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree') // starts appeal
		g.appealVote('p2', 'disagree') // (1)
		g.appealVote('p3', 'disagree') // (2) -> 2 >= 2 -> rejected

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.appealResolution).toBe('rejected')
	})

	it('scores remain unchanged on rejection', () => {
		const g = roundWithWrongAnswers()
		const p1Score = g.playerScore('p1')
		const p2Score = g.playerScore('p2')
		const p3Score = g.playerScore('p3')

		g.appealVote('p1', 'agree')
		g.appealVote('p2', 'disagree')
		g.appealVote('p3', 'disagree')

		expect(g.playerScore('p1')).toBe(p1Score)
		expect(g.playerScore('p2')).toBe(p2Score)
		expect(g.playerScore('p3')).toBe(p3Score)
	})

	it('schedules round-return after rejection', () => {
		const g = roundWithWrongAnswers()

		g.appealVote('p1', 'agree')
		g.appealVote('p2', 'disagree')
		g.appealVote('p3', 'disagree')

		expect(g.hasScheduled('round-return')).toBe(true)
	})
})

// ── Edge cases ──

describe('edge cases', () => {
	it('select-type questions: playerIdsCanAppeal is empty in snapshot', () => {
		const g = readyForHitGame(THREE_PLAYERS, 'q4')

		g.buttonHit('p1')
		g.answerGive('p1', 'a') // wrong select answer
		g.fireScheduled('button-ready')

		g.buttonHit('p2')
		g.answerGive('p2', 'c') // wrong select answer
		// 2 wrong out of 3 options-1=2 -> answer-show triggers
		expect(g.stageType).toBe('answer')

		g.fireScheduled('round-return')
		expect(g.stageType).toBe('round')

		// Snapshot should report empty playerIdsCanAppeal for select questions
		const snapshot = toSnapshot(g.state, g.ctx)
		expect(snapshot.type).toBe('round')
		if (snapshot.type === 'round') {
			expect(snapshot.playerIdsCanAppeal).toEqual([])
		}
	})

	it('player already in triedToAppeal cannot appeal again', () => {
		const g = roundWithWrongAnswers()

		// First appeal by p1 -- gets rejected
		g.appealVote('p1', 'agree')
		g.appealVote('p2', 'disagree')
		g.appealVote('p3', 'disagree')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.appealResolution).toBe('rejected')
		expect(stage.previousAnswers.triedToAppeal).toContain('p1')

		// Fire both round-returns: first is stale (from appeal start), second is valid
		g.fireScheduled('round-return') // stale -- no-op
		g.fireScheduled('round-return') // valid -- clears appealResolution
		expect(g.stageType).toBe('round')

		const stageAfterReturn = g.stage as Extract<Stage, { type: 'round' }>
		expect(stageAfterReturn.appealResolution).toBeUndefined()

		// p1 tries to appeal again -- ignored because still in triedToAppeal
		g.appealVote('p1', 'agree')
		const stageAfterRetry = g.stage as Extract<Stage, { type: 'round' }>
		expect(stageAfterRetry.appealVoting).toBeUndefined()
	})

	it('appeal cannot start during skipRoundVoting', () => {
		const g = roundWithWrongAnswers()

		// Manually set skipRoundVoting on the stage
		;(g.state.stage as any).skipRoundVoting = {
			yes: [],
			no: [],
			timeoutSeconds: 10,
		}

		g.appealVote('p1', 'agree')
		const stageAfter = g.stage as Extract<Stage, { type: 'round' }>
		expect(stageAfter.appealVoting).toBeUndefined()
	})
})
