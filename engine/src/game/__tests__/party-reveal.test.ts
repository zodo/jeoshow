import { describe, expect, it } from 'vitest'
import { PLAYER1, PLAYER2, PLAYER3 } from './helpers/fixtures'
import { partyQuestionGame } from './helpers/harness'

describe('party mode: reveal phase', () => {
	const players = [PLAYER1, PLAYER2, PLAYER3]

	it('all verdicts are included in party-reveal stage', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')
		expect(g.stageType).toBe('party-reveal')

		const stage = g.stage
		if (stage.type === 'party-reveal') {
			expect(stage.verdicts).toHaveLength(3) // all players
		} else {
			throw new Error(`Expected party-reveal but got ${stage.type}`)
		}
	})

	it('party-reveal-timeout is scheduled after reveal', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')
		expect(g.stageType).toBe('party-reveal')
		expect(g.hasScheduled('party-reveal-timeout')).toBe(true)
	})

	it('party-reveal-timeout transitions to answer stage', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')

		g.fireScheduled('party-reveal-timeout')
		expect(g.stageType).toBe('answer')
	})

	it('scores are deferred until reveal animation ends', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')

		// Scores NOT applied during party-reveal
		expect(g.playerScore('p1')).toBe(0)
		expect(g.playerScore('p2')).toBe(0)

		// Scores applied after reveal ends
		g.fireScheduled('party-reveal-timeout')
		expect(g.playerScore('p1')).toBeGreaterThanOrEqual(100)
		expect(g.playerScore('p2')).toBe(0)
	})

	it('jackpot deferred until reveal animation ends', () => {
		const g = partyQuestionGame(players)
		g.partyPass('p1')
		g.partyPass('p2')
		g.partyPass('p3')

		// Jackpot NOT updated during party-reveal
		expect(g.state.jackpot).toBe(0)

		g.fireScheduled('party-reveal-timeout')
		// After reveal ends, jackpot updated
		expect(g.state.jackpot).toBe(100)
	})

	it('fastest correct answerer becomes active player', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p2', 'correct answer')
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p3')

		// p2 submitted first → should be active
		expect(g.activePlayer).toBe('p2')
	})

	it('nobody correct → active player unchanged', () => {
		const g = partyQuestionGame(players)
		const prevActive = g.activePlayer
		g.partyPass('p1')
		g.partyPass('p2')
		g.partyPass('p3')

		expect(g.activePlayer).toBe(prevActive)
	})

	it('full flow: reveal → answer → round-return → back to round', () => {
		const g = partyQuestionGame(players)
		g.partyAnswer('p1', 'correct answer')
		g.partyPass('p2')
		g.partyPass('p3')

		g.fireScheduled('party-reveal-timeout')
		expect(g.stageType).toBe('answer')

		g.fireScheduled('round-return')
		expect(g.stageType).toBe('round')
	})

	describe('party-reveal-ready', () => {
		it('majority ready triggers answer-show', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')
			expect(g.stageType).toBe('party-reveal')

			g.partyRevealReady('p1')
			expect(g.stageType).toBe('party-reveal')

			g.partyRevealReady('p2')
			expect(g.stageType).toBe('answer') // 2/3 >= 50%
		})

		it('duplicate ready signal is ignored', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')

			g.partyRevealReady('p1')
			g.partyRevealReady('p1') // duplicate
			expect(g.stageType).toBe('party-reveal') // still only 1 unique

			g.partyRevealReady('p2')
			expect(g.stageType).toBe('answer')
		})

		it('safety timeout works as fallback', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')

			// No ready signals, just fire the safety timeout
			g.fireScheduled('party-reveal-timeout')
			expect(g.stageType).toBe('answer')
		})

		it('safety timeout is harmless after frontend-driven transition', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')

			// Frontend-driven transition
			g.partyRevealReady('p1')
			g.partyRevealReady('p2')
			expect(g.stageType).toBe('answer')

			// Safety timeout still in queue but fires harmlessly
			// (party-reveal-timeout guard rejects because stage is already 'answer')
			g.fireScheduled('party-reveal-timeout')
			expect(g.stageType).toBe('answer') // unchanged
		})

		it('disconnected player does not block majority', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')

			g.disconnect('p3')
			// 2 connected players, need >= 1
			g.partyRevealReady('p1')
			expect(g.stageType).toBe('answer')
		})

		it('ready signal ignored outside party-reveal stage', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')

			g.fireScheduled('party-reveal-timeout')
			expect(g.stageType).toBe('answer')

			// Ready signal on answer stage — should be no-op
			g.partyRevealReady('p1')
			expect(g.stageType).toBe('answer')
		})

		it('full flow with ready signals', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')

			g.partyRevealReady('p1')
			g.partyRevealReady('p2')
			expect(g.stageType).toBe('answer')

			g.fireScheduled('round-return')
			expect(g.stageType).toBe('round')
		})

		it('party-reveal-timeout with wrong callbackId is no-op', () => {
			const g = partyQuestionGame(players)
			g.partyAnswer('p1', 'correct answer')
			g.partyPass('p2')
			g.partyPass('p3')
			expect(g.stageType).toBe('party-reveal')

			// Fire with wrong callbackId
			g.apply({
				type: 'server',
				action: { type: 'party-reveal-timeout', callbackId: 'wrong-id' },
			})
			expect(g.stageType).toBe('party-reveal') // unchanged
		})
	})
})
