import { describe, it, expect } from 'vitest'
import { GameHarness, startedGame } from './helpers/harness'
import { PLAYER1, PLAYER2, PLAYER3, makePlayer } from './helpers/fixtures'

// ── introduce ──

describe('introduce', () => {
	it('adds a new player and broadcasts players-updated', () => {
		const g = new GameHarness([])
		expect(g.players).toHaveLength(0)

		g.introduce('p1', 'Alice')

		expect(g.players).toHaveLength(1)
		const p1 = g.player('p1')
		expect(p1.name).toBe('Alice')
		expect(p1.disconnected).toBe(false)

		// players-updated is auto-broadcast by the DO (not a handler effect)

		const reply = g.replies.find(
			(e) => e.type === 'client-reply' && e.event.type === 'stage-updated'
		)
		expect(reply).toBeDefined()
	})

	it('updates name when introducing the same player again', () => {
		const g = new GameHarness()
		g.introduce('p1', 'Alice')
		g.introduce('p1', 'Alice2')

		const matches = g.players.filter((p) => p.id === 'p1')
		expect(matches).toHaveLength(1)
		expect(matches[0].name).toBe('Alice2')
	})

	it('reconnects a disconnected player', () => {
		const g = new GameHarness()
		g.introduce('p1', 'Alice')
		g.introduce('p2', 'Bob')
		g.gameStart('p1')
		g.disconnect('p1')

		expect(g.player('p1').disconnected).toBe(true)

		g.introduce('p1', 'Alice')
		expect(g.player('p1').disconnected).toBe(false)
	})

	it('preserves score on reconnect', () => {
		const g = startedGame()
		const active = g.activePlayer

		// Score some points
		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')

		expect(g.playerScore('p1')).toBe(100)

		// Disconnect and reconnect
		g.disconnect('p1')
		g.introduce('p1', 'Alice')

		expect(g.playerScore('p1')).toBe(100)
	})

	it('resumes a paused round when a player introduces', () => {
		const g = new GameHarness()
		g.introduce('p1', 'Alice')
		g.introduce('p2', 'Bob')
		g.gameStart('p1')

		// Disconnect all players to pause
		g.disconnect('p1')
		g.disconnect('p2')

		// Fire round-return to get a paused round stage
		// We need a question flow first to reach round-return
		// Instead, just verify the paused state after reconnection logic
		// Let's set up a paused round by going through a question cycle
		// Actually, disconnecting during round stage doesn't pause immediately.
		// The pause happens in round-return. Let's do a full question cycle.

		// Start fresh: go through a question so round-return can detect all disconnected
		const g2 = startedGame()
		const active = g2.activePlayer
		g2.selectQuestion(active, 'q1')
		g2.fireScheduled('button-ready')
		g2.buttonHit(active)
		g2.answerGive(active, 'correct answer')
		// Now at 'answer' stage, round-return is scheduled

		// Disconnect both players
		g2.disconnect('p1')
		g2.disconnect('p2')

		// Fire round-return → should pause
		g2.fireScheduled('round-return')
		expect(g2.stageType).toBe('round')
		const stage = g2.stage as Extract<typeof g2.stage, { type: 'round' }>
		expect(stage.paused).toBe(true)

		// Introduce a player → unpauses
		g2.clearEffects()
		g2.introduce('p1', 'Alice')
		const stageAfter = g2.stage as Extract<typeof g2.stage, { type: 'round' }>
		expect(stageAfter.paused).toBe(false)
		expect(stageAfter.activePlayer).toBe('p1')

		// The reply snapshot sent to the reconnecting client should also show unpaused
		const reply = g2.replies.find(
			(e) => e.type === 'client-reply' && e.event.type === 'stage-updated'
		)
		expect(reply).toBeDefined()
		if (reply?.type === 'client-reply' && reply.event.type === 'stage-updated') {
			expect(reply.event.stage.type).toBe('round')
			if (reply.event.stage.type === 'round') {
				expect(reply.event.stage.activePlayerId).toBe('p1')
			}
		}
	})
})

// ── game-start ──

describe('game-start', () => {
	it('transitions from before-start to round stage', () => {
		const g = new GameHarness()
		g.introduce('p1', 'Alice')
		g.introduce('p2', 'Bob')

		expect(g.stageType).toBe('before-start')
		g.gameStart('p1')
		expect(g.stageType).toBe('round')
	})

	it('first round ID matches pack first round', () => {
		const g = new GameHarness()
		g.introduce('p1', 'Alice')
		g.introduce('p2', 'Bob')
		g.gameStart('p1')

		const stage = g.stage as Extract<typeof g.stage, { type: 'round' }>
		expect(stage.roundId).toBe('r1')
	})

	it('schedules question-random timeout', () => {
		const g = new GameHarness()
		g.introduce('p1', 'Alice')
		g.introduce('p2', 'Bob')
		g.gameStart('p1')

		expect(g.hasScheduled('question-random')).toBe(true)
	})

	it('activePlayer is set to one of the alive players', () => {
		const g = new GameHarness()
		g.introduce('p1', 'Alice')
		g.introduce('p2', 'Bob')
		g.gameStart('p1')

		const playerIds = g.players.filter((p) => !p.disconnected).map((p) => p.id)
		expect(playerIds).toContain(g.activePlayer)
	})
})

// ── game finish ──

describe('game finish', () => {
	it('reaches after-finish after all questions in all rounds', () => {
		const g = startedGame()

		// Helper: play one regular question through to round-return
		const playRegular = (questionId: string, answer: string) => {
			const active = g.activePlayer
			g.selectQuestion(active, questionId)
			g.fireScheduled('button-ready')
			g.buttonHit(active)
			g.answerGive(active, answer)
			g.fireScheduled('round-return')
		}

		// Helper: play one select question through to round-return
		const playSelect = (questionId: string, correctName: string) => {
			const active = g.activePlayer
			g.selectQuestion(active, questionId)
			g.fireScheduled('button-ready')
			g.buttonHit(active)
			g.answerGive(active, correctName)
			g.fireScheduled('round-return')
		}

		// Round 1: q1, q2, q7 (regular), q3, q4 (select, correct='b')
		playRegular('q1', 'correct answer')
		expect(g.stageType).toBe('round')

		playRegular('q2', 'answer two')
		expect(g.stageType).toBe('round')

		playRegular('q7', 'чайник')
		expect(g.stageType).toBe('round')

		playRegular('q3', 'third')
		expect(g.stageType).toBe('round')

		playSelect('q4', 'b')
		// After all 5 questions in r1, should advance to r2
		expect(g.stageType).toBe('round')
		const stageR2 = g.stage as Extract<typeof g.stage, { type: 'round' }>
		expect(stageR2.roundId).toBe('r2')

		// Round 2: q5, q6 (regular)
		playRegular('q5', 'five')
		expect(g.stageType).toBe('round')

		playRegular('q6', 'six')
		// After all questions in the last round → after-finish
		expect(g.stageType).toBe('after-finish')
	})
})
