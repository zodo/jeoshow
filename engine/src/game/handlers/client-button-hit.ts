import type { FalseStartRecord, GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleClientButtonHit = (
	state: GameState,
	command: ClientCommand.OfType<'button-hit'>,
	ctx: CommandContext
): UpdateResult => {
	if (
		(state.stage.type === 'question' || state.stage.type === 'ready-for-hit') &&
		isPlayerInFalseStartBan(ctx, state.stage.falseStartPlayers, command.playerId)
	) {
		return {
			effects: [
				{
					type: 'client-broadcast',
					event: {
						type: 'player-hit-the-button',
						playerId: command.playerId,
						falseStart: true,
					},
				},
			],
		}
	} else if (state.stage.type === 'question') {
		const newStage = {
			...state.stage,
			falseStartPlayers: updateFalseStartPlayers(
				state.stage.falseStartPlayers,
				command.playerId,
				ctx
			),
		}
		return {
			state: { ...state, stage: newStage },
			effects: [
				{
					type: 'client-broadcast',
					event: {
						type: 'player-hit-the-button',
						playerId: command.playerId,
						falseStart: true,
					},
				},
				{
					type: 'client-reply',
					event: {
						type: 'stage-updated',
						stage: toSnapshot(newStage, ctx),
					},
				},
				{
					type: 'schedule',
					command: {
						type: 'server',
						action: { type: 'fire-stage-update' },
					},
					delaySeconds: 3,
				},
			],
		}
	} else if (
		state.stage.type === 'ready-for-hit' &&
		state.stage.randomizeHits &&
		!state.stage.previousAnswers.answers.some((a) => a.playerId === command.playerId)
	) {
		const newStage: Extract<Stage, { type: 'ready-for-hit' }> = {
			...state.stage,
			playersWhoHit: [...state.stage.playersWhoHit, command.playerId],
		}
		return {
			state: {
				...state,
				stage: newStage,
			},
			effects: [
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
				},
				{
					type: 'client-broadcast',
					event: {
						type: 'player-hit-the-button',
						playerId: command.playerId,
						falseStart: false,
					},
				},
			],
		}
	} else if (
		state.stage.type === 'ready-for-hit' &&
		!state.stage.previousAnswers.answers.some((a) => a.playerId === command.playerId)
	) {
		return goToAwaitingAnswer(state, ctx, command.playerId)
	} else {
		return {
			state: state,
			effects: [
				{
					type: 'client-broadcast',
					event: {
						type: 'player-hit-the-button',
						playerId: command.playerId,
						falseStart: false,
					},
				},
			],
		}
	}
}

export const goToAwaitingAnswer = (
	state: GameState,
	ctx: CommandContext,
	playerId: string
): UpdateResult => {
	if (state.stage.type !== 'ready-for-hit') {
		return {}
	}

	const callbackId = Math.random().toString(36).substring(7)
	const newStage: Extract<Stage, { type: 'awaiting-answer' }> = {
		...state.stage,
		type: 'awaiting-answer',
		answeringPlayer: playerId,
		callbackId,
		callbackTimeout: Timeouts.awaitingAnswer,
	}
	return {
		state: {
			...state,
			stage: newStage,
		},
		effects: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
			},
			{
				type: 'client-broadcast',
				event: { type: 'player-hit-the-button', playerId, falseStart: false },
			},
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: { type: 'answer-timeout', callbackId },
				},
				delaySeconds: Timeouts.awaitingAnswer,
			},
		],
	}
}

const isPlayerInFalseStartBan = (
	ctx: CommandContext,
	falseStartPlayers: FalseStartRecord[],
	playerId: string
): boolean => {
	const falseStart = falseStartPlayers.find((record) => record.playerId === playerId)
	if (!falseStart) return false

	return ctx.now < falseStart.expiresAt
}

const updateFalseStartPlayers = (
	falseStartPlayers: FalseStartRecord[],
	playerId: string,
	ctx: CommandContext
): FalseStartRecord[] => {
	if (isPlayerInFalseStartBan(ctx, falseStartPlayers, playerId)) {
		return falseStartPlayers
	}
	return [
		...falseStartPlayers.filter((p) => p.playerId !== playerId),
		{ playerId, expiresAt: ctx.now + 2900 },
	]
}

export default handleClientButtonHit
