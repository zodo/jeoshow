import { describe, it, expect } from 'vitest'
import { startedGame, readyForHitGame } from './helpers/harness'
import type { Stage } from '../models/state'

// ── media-finished ──

describe('media-finished', () => {
	it('during question stage: triggers button-ready and transitions to ready-for-hit', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')
		expect(g.stageType).toBe('question')

		g.mediaFinished('p1')
		expect(g.stageType).toBe('ready-for-hit')
	})

	it('during answer stage, first player: schedules round-return', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')
		expect(g.stageType).toBe('answer')
		g.clearEffects()

		g.mediaFinished('p1')

		expect(g.hasScheduled('round-return')).toBe(true)
		const stage = g.stage as Extract<Stage, { type: 'answer' }>
		expect(stage.finishedMediaPlayers).toContain('p1')
	})

	it('during answer stage, all players finished: triggers round-return immediately', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')
		expect(g.stageType).toBe('answer')
		g.clearEffects()

		g.mediaFinished('p1')
		g.mediaFinished('p2')

		// All players finished → round-return triggered immediately → back to round
		expect(g.stageType).toBe('round')
	})

	it('during other stages: no-op', () => {
		const g = readyForHitGame()
		expect(g.stageType).toBe('ready-for-hit')
		g.clearEffects()

		g.mediaFinished('p1')

		expect(g.stageType).toBe('ready-for-hit')
		expect(g.broadcasts).toHaveLength(0)
		expect(g.scheduled).toHaveLength(0)
	})
})

// ── answer-skip ──

describe('answer-skip', () => {
	it('vote adds to votedForSkip (stage-updated auto-broadcast by DO)', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')
		expect(g.stageType).toBe('answer')
		g.clearEffects()

		g.answerSkip('p1')

		const stage = g.stage as Extract<Stage, { type: 'answer' }>
		expect(stage.votedForSkip).toContain('p1')
	})

	it('all alive players vote → triggers round-return', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')
		expect(g.stageType).toBe('answer')

		g.answerSkip('p1')
		g.answerSkip('p2')

		// Both players voted → round-return triggered → back to round
		expect(g.stageType).toBe('round')
	})

	it('duplicate vote is ignored', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		g.answerGive('p1', 'correct answer')
		expect(g.stageType).toBe('answer')
		g.clearEffects()

		g.answerSkip('p1')
		g.answerSkip('p1')

		const stage = g.stage as Extract<Stage, { type: 'answer' }>
		expect(stage.votedForSkip.filter((id) => id === 'p1')).toHaveLength(1)
	})

	it('only works during answer stage', () => {
		const g = readyForHitGame()
		expect(g.stageType).toBe('ready-for-hit')
		g.clearEffects()

		g.answerSkip('p1')

		expect(g.stageType).toBe('ready-for-hit')
		expect(g.broadcasts).toHaveLength(0)
	})
})

// ── answer-typing ──

describe('answer-typing', () => {
	it('answering player typing broadcasts player-typing', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')
		g.clearEffects()

		g.answerTyping('p1', 'hello')

		expect(g.broadcasts).toHaveLength(1)
		expect(g.broadcasts[0]).toMatchObject({
			type: 'client-broadcast',
			event: { type: 'player-typing', playerId: 'p1', value: 'hello' },
		})
	})

	it('non-answering player typing is ignored', () => {
		const g = readyForHitGame()
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')
		g.clearEffects()

		g.answerTyping('p2', 'sneaky')

		expect(g.broadcasts).toHaveLength(0)
	})
})

// ── message-send ──

describe('message-send', () => {
	it('broadcasts player-sent-message with correct playerId and text', () => {
		const g = startedGame()
		g.clearEffects()

		g.messageSend('p1', 'Hello world')

		expect(g.broadcasts).toHaveLength(1)
		expect(g.broadcasts[0]).toMatchObject({
			type: 'client-broadcast',
			event: { type: 'player-sent-message', playerId: 'p1', text: 'Hello world' },
		})
	})
})

// ── ping-set ──

describe('ping-set', () => {
	it('updates player ping value in state', () => {
		const g = startedGame()
		expect(g.player('p1').ping).toBe(0)

		g.pingSet('p1', 42)

		expect(g.player('p1').ping).toBe(42)
	})
})
