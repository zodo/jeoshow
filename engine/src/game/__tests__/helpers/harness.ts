import type { Player } from 'shared/models/models'
import type { GameState } from '../../models/state'
import type { GameCommand, ServerAction } from '../../models/state-commands'
import type { CommandContext, UpdateEffect, UpdateResult } from '../../models/state-machine'
import { updateState } from '../../state-update'
import {
	makeContext,
	makeInitialState,
	PLAYER1,
	PLAYER2,
	resetRandom,
} from './fixtures'

export interface ScheduledEntry {
	command: GameCommand
	delaySeconds: number
}

/**
 * Test harness for the game state machine.
 *
 * Wraps updateState and:
 * - Recursively executes `trigger` effects (like the real DO does)
 * - Collects `schedule` effects for manual firing
 * - Tracks all broadcast/reply events
 * - Provides convenience methods for common commands
 */
export class GameHarness {
	state: GameState
	ctx: CommandContext
	scheduled: ScheduledEntry[] = []
	broadcasts: UpdateEffect[] = []
	replies: UpdateEffect[] = []
	llmRequests: Extract<UpdateEffect, { type: 'llm-judge' }>[] = []
	llmBatchRequests: Extract<UpdateEffect, { type: 'llm-judge-batch' }>[] = []

	constructor(
		players: Player[] = [PLAYER1, PLAYER2],
		ctxOverrides?: Partial<CommandContext>
	) {
		resetRandom()
		this.state = makeInitialState(players)
		this.ctx = makeContext(ctxOverrides)
	}

	/** Clear accumulated effects. Call between logical sections if needed. */
	clearEffects() {
		this.scheduled = []
		this.broadcasts = []
		this.replies = []
		this.llmRequests = []
		this.llmBatchRequests = []
	}

	// ── Core ──

	/** Apply a command, auto-processing triggers recursively. */
	apply(command: GameCommand, depth = 0): UpdateResult {
		if (depth > 10) {
			throw new Error(`Likely infinite trigger loop at depth ${depth}`)
		}

		const result = updateState(this.state, command, this.ctx)

		if (result.state) {
			this.state = result.state
		}

		const allEffects: UpdateEffect[] = []

		for (const effect of result.effects ?? []) {
			if (effect.type === 'trigger') {
				// Recursively apply triggered commands (just like the real DO)
				const triggerResult = this.apply(effect.command, depth + 1)
				if (triggerResult.effects) {
					allEffects.push(...triggerResult.effects)
				}
			} else if (effect.type === 'schedule') {
				this.scheduled.push({
					command: effect.command,
					delaySeconds: effect.delaySeconds,
				})
				allEffects.push(effect)
			} else if (effect.type === 'client-broadcast') {
				this.broadcasts.push(effect)
				allEffects.push(effect)
			} else if (effect.type === 'client-reply') {
				this.replies.push(effect)
				allEffects.push(effect)
			} else if (effect.type === 'llm-judge') {
				this.llmRequests.push(effect)
				allEffects.push(effect)
			} else if (effect.type === 'llm-judge-batch') {
				this.llmBatchRequests.push(effect)
				allEffects.push(effect)
			}
		}

		return { state: this.state, effects: allEffects }
	}

	// ── Scheduled command helpers ──

	/** Fire a scheduled command by server action type. Removes it from the queue. */
	fireScheduled(actionType: ServerAction['type']): UpdateResult {
		const idx = this.scheduled.findIndex(
			(s) => s.command.type === 'server' && s.command.action.type === actionType
		)
		if (idx === -1) {
			throw new Error(
				`No scheduled command with action type "${actionType}". ` +
					`Available: [${this.scheduled.map((s) => s.command.type === 'server' ? s.command.action.type : '(client)').join(', ')}]`
			)
		}
		const [entry] = this.scheduled.splice(idx, 1)
		return this.apply(entry.command)
	}

	/** Check if a scheduled command of the given type exists. */
	hasScheduled(actionType: ServerAction['type']): boolean {
		return this.scheduled.some(
			(s) => s.command.type === 'server' && s.command.action.type === actionType
		)
	}

	// ── Client command shortcuts ──

	introduce(playerId: string, name?: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'introduce', name: name ?? playerId },
		})
	}

	gameStart(playerId: string = 'p1', gameMode: 'classic' | 'party' = 'classic') {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'game-start', gameMode },
		})
	}

	selectQuestion(playerId: string, questionId: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'question-select', questionId },
		})
	}

	buttonHit(playerId: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'button-hit' },
		})
	}

	answerGive(playerId: string, value: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'answer-give', value },
		})
	}

	answerTyping(playerId: string, value: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'answer-typing', value },
		})
	}

	mediaFinished(playerId: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'media-finished' },
		})
	}

	appealVote(playerId: string, vote: 'agree' | 'disagree') {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'appeal-vote', vote },
		})
	}

	roundSkip(playerId: string, vote: 'yes' | 'no') {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'round-skip', vote },
		})
	}

	pingSet(playerId: string, ping: number) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'ping-set', ping },
		})
	}

	answerSkip(playerId: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'answer-skip' },
		})
	}

	messageSend(playerId: string, text: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'message-send', text },
		})
	}

	partyAnswer(playerId: string, value: string, confidenceBet = false) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'party-answer', value, confidenceBet },
		})
	}

	partyPass(playerId: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'party-pass' },
		})
	}

	partyRevealReady(playerId: string) {
		return this.apply({
			type: 'client',
			playerId,
			action: { type: 'party-reveal-ready' },
		})
	}

	partyLlmVerdict(playerId: string, correct: boolean) {
		const lastBatch = this.llmBatchRequests[this.llmBatchRequests.length - 1]
		if (!lastBatch) {
			throw new Error('No pending LLM batch request')
		}
		return this.apply({
			type: 'server',
			action: {
				type: 'party-llm-verdict',
				playerId,
				correct,
				callbackId: lastBatch.callbackId,
			},
		})
	}

	disconnect(playerId: string) {
		return this.apply({
			type: 'server',
			action: { type: 'player-disconnect', playerId },
		})
	}

	llmVerdict(correct: boolean) {
		const lastLlm = this.llmRequests[this.llmRequests.length - 1]
		if (!lastLlm) {
			throw new Error('No pending LLM request')
		}
		return this.apply({
			type: 'server',
			action: { type: 'llm-verdict', correct, callbackId: lastLlm.callbackId },
		})
	}

	// ── State query helpers ──

	get stage() {
		return this.state.stage
	}

	get stageType() {
		return this.state.stage.type
	}

	get players() {
		return this.state.players
	}

	player(id: string): Player {
		const p = this.state.players.find((p) => p.id === id)
		if (!p) throw new Error(`Player ${id} not found`)
		return p
	}

	playerScore(id: string): number {
		return this.player(id).score
	}

	/** Get the active player ID (only valid for round-based stages). */
	get activePlayer(): string {
		const stage = this.state.stage
		if ('activePlayer' in stage) return stage.activePlayer
		throw new Error(`Stage ${stage.type} has no activePlayer`)
	}
}

/**
 * Create a harness with 2 players already introduced and game started.
 * Returns in 'round' stage with an active player ready to select a question.
 */
export const startedGame = (
	players: Player[] = [PLAYER1, PLAYER2],
	ctxOverrides?: Partial<CommandContext>
): GameHarness => {
	const g = new GameHarness(players, ctxOverrides)
	for (const p of players) {
		g.introduce(p.id, p.name)
	}
	g.gameStart(players[0].id)
	g.clearEffects()
	return g
}

/**
 * Create a harness at the 'ready-for-hit' stage.
 * question q1 (price 100, answer "correct answer") is active.
 */
/**
 * Create a harness with players introduced and party game started.
 * Returns in 'round' stage ready to select a question.
 */
export const startedPartyGame = (
	players: Player[] = [PLAYER1, PLAYER2],
	ctxOverrides?: Partial<CommandContext>
): GameHarness => {
	const g = new GameHarness(players, ctxOverrides)
	for (const p of players) {
		g.introduce(p.id, p.name)
	}
	g.gameStart(players[0].id, 'party')
	g.clearEffects()
	return g
}

/**
 * Create a party harness at the 'party-question' stage.
 * question q1 (price 100, answer "correct answer") is active.
 */
export const partyQuestionGame = (
	players: Player[] = [PLAYER1, PLAYER2],
	questionId: string = 'q1',
	ctxOverrides?: Partial<CommandContext>
): GameHarness => {
	const g = startedPartyGame(players, ctxOverrides)
	g.selectQuestion(g.activePlayer, questionId)
	// Keep scheduled (party-answer-timeout) but clear other effects
	g.broadcasts = []
	g.replies = []
	g.llmRequests = []
	g.llmBatchRequests = []
	return g
}

export const readyForHitGame = (
	players: Player[] = [PLAYER1, PLAYER2],
	questionId: string = 'q1',
	ctxOverrides?: Partial<CommandContext>
): GameHarness => {
	const g = startedGame(players, ctxOverrides)
	g.selectQuestion(g.activePlayer, questionId)
	g.fireScheduled('button-ready')
	g.clearEffects()
	return g
}
