import { describe, it, expect } from 'vitest'
import { startedGame, readyForHitGame } from './helpers/harness'
import { PLAYER1, PLAYER2, PLAYER3 } from './helpers/fixtures'
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

// ── Disconnect ──

describe('disconnect', () => {
	it('marks the player as disconnected', () => {
		const g = startedGame()

		g.disconnect('p1')

		expect(g.player('p1').disconnected).toBe(true)
		expect(g.player('p2').disconnected).toBe(false)
	})

	it('broadcasts players-updated when some players remain connected', () => {
		const g = startedGame()

		g.disconnect('p1')

		const broadcast = g.broadcasts.find(
			(b) => b.type === 'client-broadcast' && b.event.type === 'players-updated'
		)
		expect(broadcast).toBeDefined()
	})

	it('schedules state-cleanup when ALL players disconnect', () => {
		const g = startedGame()

		g.disconnect('p1')
		g.disconnect('p2')

		expect(g.hasScheduled('state-cleanup')).toBe(true)
	})

	it('does not schedule state-cleanup when some players remain', () => {
		const g = startedGame()

		g.disconnect('p1')

		expect(g.hasScheduled('state-cleanup')).toBe(false)
	})

	it('disconnecting an unknown player is a no-op', () => {
		const g = startedGame()
		const stateBefore = g.state

		g.clearEffects()
		g.disconnect('unknown-player')

		expect(g.state.players).toEqual(stateBefore.players)
		expect(g.broadcasts).toHaveLength(0)
		expect(g.hasScheduled('state-cleanup')).toBe(false)
	})
})

// ── Pause and resume ──

describe('pause and resume', () => {
	it('all players disconnect during answer stage, then round-return pauses the round', () => {
		const g = startedGame()
		const active = g.activePlayer

		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit(active)
		g.answerGive(active, 'correct answer')

		// Disconnect all players while in 'answer' stage
		expect(g.stageType).toBe('answer')
		g.disconnect('p1')
		g.disconnect('p2')

		// Fire round-return — should pause instead of scheduling question-random
		g.fireScheduled('round-return')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.type).toBe('round')
		expect(stage.paused).toBe(true)
	})

	it('paused round does NOT schedule question-random', () => {
		const g = startedGame()
		const active = g.activePlayer

		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit(active)
		g.answerGive(active, 'correct answer')

		g.disconnect('p1')
		g.disconnect('p2')

		g.fireScheduled('round-return')

		expect(g.hasScheduled('question-random')).toBe(false)
	})

	it('player rejoins a paused round: unpauses and becomes activePlayer', () => {
		const g = startedGame()
		const active = g.activePlayer

		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit(active)
		g.answerGive(active, 'correct answer')

		g.disconnect('p1')
		g.disconnect('p2')
		g.fireScheduled('round-return')

		// Verify paused
		expect((g.stage as Extract<Stage, { type: 'round' }>).paused).toBe(true)

		// p2 reconnects
		g.introduce('p2', 'Bob')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.paused).toBe(false)
		expect(stage.activePlayer).toBe('p2')
		expect(g.player('p2').disconnected).toBe(false)
	})
})

// ── Active player transfer ──

describe('active player transfer', () => {
	it('active player disconnects, round-return transfers to another alive player', () => {
		const g = startedGame(THREE_PLAYERS)
		const active = g.activePlayer

		g.selectQuestion(active, 'q1')
		g.fireScheduled('button-ready')
		g.buttonHit(active)
		g.answerGive(active, 'correct answer')

		// Disconnect the active player before round-return
		g.disconnect(active)
		g.fireScheduled('round-return')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.type).toBe('round')
		expect(stage.activePlayer).not.toBe(active)
		// The new active player should be one of the connected ones
		const newActive = g.player(stage.activePlayer)
		expect(newActive.disconnected).toBe(false)
	})

	it('with 3 players: disconnect activePlayer, complete question, round-return picks someone else', () => {
		const g = startedGame(THREE_PLAYERS)

		// Complete q1 so we are back at round stage
		completeQuestion(g, 'q1', 'correct answer')
		expect(g.stageType).toBe('round')

		const active = g.activePlayer
		g.disconnect(active)

		// Now complete another question with a connected player
		const connected = g.players.filter((p) => !p.disconnected)
		const picker = connected[0].id

		// Manually select with a connected player (the handler will check activePlayer)
		// Since activePlayer is disconnected, we fire question-random to auto-select
		g.fireScheduled('question-random')

		// Now we should be in question stage, complete the flow
		expect(g.stageType).toBe('question')
		g.fireScheduled('button-ready')
		g.buttonHit(picker)
		g.answerGive(picker, 'answer two')
		g.fireScheduled('round-return')

		const stage = g.stage as Extract<Stage, { type: 'round' }>
		expect(stage.type).toBe('round')
		expect(stage.activePlayer).not.toBe(active)
		expect(g.player(stage.activePlayer).disconnected).toBe(false)
	})
})
