import { describe, it, expect } from 'vitest'
import { startedGame, readyForHitGame } from './helpers/harness'
import type { Stage } from '../models/state'

// ── False starts ──

describe('false starts', () => {
	it('hitting button during question stage broadcasts falseStart and adds to falseStartPlayers', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')
		// Now in 'question' stage, button-ready has NOT fired yet
		expect(g.stageType).toBe('question')
		g.clearEffects()

		g.buttonHit('p1')

		// Still in question stage
		expect(g.stageType).toBe('question')

		// Broadcast includes falseStart=true
		const hitBroadcast = g.broadcasts.find(
			(b) => b.type === 'client-broadcast' && b.event.type === 'player-hit-the-button'
		)
		expect(hitBroadcast).toBeDefined()
		expect(
			hitBroadcast!.type === 'client-broadcast' &&
				hitBroadcast!.event.type === 'player-hit-the-button' &&
				hitBroadcast!.event.falseStart
		).toBe(true)

		// Player added to falseStartPlayers
		const stage = g.stage as Extract<Stage, { type: 'question' }>
		expect(stage.falseStartPlayers).toHaveLength(1)
		expect(stage.falseStartPlayers[0].playerId).toBe('p1')
		expect(stage.falseStartPlayers[0].expiresAt).toBe(g.ctx.now + 2900)
	})

	it('player already in false-start ban hitting again broadcasts falseStart but does not change state', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')

		// First false start
		g.buttonHit('p1')
		const stage1 = g.stage as Extract<Stage, { type: 'question' }>
		const falseStartsBefore = [...stage1.falseStartPlayers]
		expect(falseStartsBefore).toHaveLength(1)

		g.clearEffects()

		// Second hit while still in ban (ctx.now hasn't changed)
		g.buttonHit('p1')

		// Broadcast still sent
		const hitBroadcast = g.broadcasts.find(
			(b) => b.type === 'client-broadcast' && b.event.type === 'player-hit-the-button'
		)
		expect(hitBroadcast).toBeDefined()

		// But falseStartPlayers array is unchanged (no new entry, no update)
		const stage2 = g.stage as Extract<Stage, { type: 'question' }>
		expect(stage2.falseStartPlayers).toHaveLength(1)
		expect(stage2.falseStartPlayers[0].expiresAt).toBe(falseStartsBefore[0].expiresAt)
	})

	it('false start ban expires: player can hit normally in ready-for-hit', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')

		// False start during question stage
		g.buttonHit('p1')
		const stage = g.stage as Extract<Stage, { type: 'question' }>
		expect(stage.falseStartPlayers).toHaveLength(1)

		// Advance time past the ban expiry
		g.ctx.now = stage.falseStartPlayers[0].expiresAt + 1

		// Transition to ready-for-hit (falseStartPlayers carry over)
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		g.clearEffects()

		// Player hits button — ban has expired so it should go to awaiting-answer
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')
	})

	it('false start ban still active during ready-for-hit blocks normal hit', () => {
		const g = startedGame()
		g.selectQuestion(g.activePlayer, 'q1')

		// False start during question stage
		g.buttonHit('p1')

		// Transition to ready-for-hit WITHOUT advancing time
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')
		g.clearEffects()

		// Player hits button — ban still active, should get falseStart broadcast
		g.buttonHit('p1')
		expect(g.stageType).toBe('ready-for-hit')

		const hitBroadcast = g.broadcasts.find(
			(b) =>
				b.type === 'client-broadcast' &&
				b.event.type === 'player-hit-the-button' &&
				b.event.falseStart === true
		)
		expect(hitBroadcast).toBeDefined()
	})
})

// ── Randomized hits (high ping) ──

describe('randomized hits (high ping)', () => {
	it('high ping enables randomizeHits and schedules button-hit-choose', () => {
		const g = startedGame()
		g.pingSet('p1', 400)
		g.pingSet('p2', 400)

		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		const stage = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage.randomizeHits).toBe(true)
		expect(stage.playersWhoHit).toEqual([])
		expect(g.hasScheduled('button-hit-choose')).toBe(true)
	})

	it('when randomizeHits is true, button-hit adds player to playersWhoHit instead of awaiting-answer', () => {
		const g = startedGame()
		g.pingSet('p1', 400)
		g.pingSet('p2', 400)
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')
		g.clearEffects()

		g.buttonHit('p1')

		// Should stay in ready-for-hit, not transition to awaiting-answer
		expect(g.stageType).toBe('ready-for-hit')
		const stage = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage.playersWhoHit).toContain('p1')

		// Second player also hits
		g.buttonHit('p2')
		expect(g.stageType).toBe('ready-for-hit')
		const stage2 = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage2.playersWhoHit).toContain('p2')
		expect(stage2.playersWhoHit).toHaveLength(2)
	})

	it('button-hit-choose picks a winner and transitions to awaiting-answer', () => {
		const g = startedGame()
		g.pingSet('p1', 400)
		g.pingSet('p2', 400)
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		g.buttonHit('p1')
		g.buttonHit('p2')

		g.fireScheduled('button-hit-choose')

		expect(g.stageType).toBe('awaiting-answer')
		const stage = g.stage as Extract<Stage, { type: 'awaiting-answer' }>
		expect(['p1', 'p2']).toContain(stage.answeringPlayer)
	})

	it('button-hit-choose with nobody hit resets randomizeHits to false', () => {
		const g = startedGame()
		g.pingSet('p1', 400)
		g.pingSet('p2', 400)
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		// Nobody hits, just fire the choose timer
		g.fireScheduled('button-hit-choose')

		expect(g.stageType).toBe('ready-for-hit')
		const stage = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage.randomizeHits).toBe(false)
		expect(stage.playersWhoHit).toEqual([])
	})

	it('after randomizeHits reset, normal button-hit goes to awaiting-answer', () => {
		const g = startedGame()
		g.pingSet('p1', 400)
		g.pingSet('p2', 400)
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		// Nobody hits, choose resets randomizeHits
		g.fireScheduled('button-hit-choose')
		expect(g.stageType).toBe('ready-for-hit')
		const stage = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage.randomizeHits).toBe(false)

		// Now a player hits — should go directly to awaiting-answer
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')
	})
})

// ── Already answered players ──

describe('already answered players', () => {
	it('player who already gave wrong answer cannot hit button again', () => {
		const g = readyForHitGame()

		// p1 hits and gives wrong answer
		g.buttonHit('p1')
		expect(g.stageType).toBe('awaiting-answer')
		g.answerGive('p1', 'wrong answer')

		// Wrong answer goes to llm-checking, resolve as incorrect
		expect(g.stageType).toBe('llm-checking')
		g.llmVerdict(false)

		// After incorrect answer, it goes to answer-attempt then button-ready fires
		expect(g.stageType).toBe('answer-attempt')
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		// Verify p1 is in previousAnswers
		const stage = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage.previousAnswers.answers.some((a) => a.playerId === 'p1')).toBe(true)

		g.clearEffects()

		// p1 tries to hit again — should be ignored (no stage change)
		g.buttonHit('p1')
		expect(g.stageType).toBe('ready-for-hit')
	})

	it('other player can still hit after first player gave wrong answer', () => {
		const g = readyForHitGame()

		// p1 hits and gives wrong answer
		g.buttonHit('p1')
		g.answerGive('p1', 'wrong answer')
		expect(g.stageType).toBe('llm-checking')
		g.llmVerdict(false)

		expect(g.stageType).toBe('answer-attempt')
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		// p2 hits — should succeed
		g.buttonHit('p2')
		expect(g.stageType).toBe('awaiting-answer')
		const stage = g.stage as Extract<Stage, { type: 'awaiting-answer' }>
		expect(stage.answeringPlayer).toBe('p2')
	})

	it('already answered player ignored even with randomizeHits', () => {
		const g = startedGame()
		g.pingSet('p1', 400)
		g.pingSet('p2', 400)
		g.selectQuestion(g.activePlayer, 'q1')
		g.fireScheduled('button-ready')

		// p1 hits and answers wrong
		g.buttonHit('p1')
		g.buttonHit('p2')
		g.fireScheduled('button-hit-choose')
		const winner = (g.stage as Extract<Stage, { type: 'awaiting-answer' }>).answeringPlayer

		g.answerGive(winner, 'wrong answer')
		expect(g.stageType).toBe('llm-checking')
		g.llmVerdict(false)

		expect(g.stageType).toBe('answer-attempt')
		g.fireScheduled('button-ready')
		expect(g.stageType).toBe('ready-for-hit')

		const stage = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage.previousAnswers.answers.some((a) => a.playerId === winner)).toBe(true)

		g.clearEffects()

		// Winner tries to hit again — should stay in ready-for-hit
		g.buttonHit(winner)
		expect(g.stageType).toBe('ready-for-hit')
		const stage2 = g.stage as Extract<Stage, { type: 'ready-for-hit' }>
		expect(stage2.playersWhoHit).not.toContain(winner)
	})
})
