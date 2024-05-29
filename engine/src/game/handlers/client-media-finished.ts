import type { GameState } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { Timeouts } from '../timeouts'

const handleClientMediaFinished = (
	state: GameState,
	command: ClientCommand.OfType<'media-finished'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'question' && state.stage.type !== 'answer') {
		return {}
	}

	if (state.stage.type === 'question') {
		return {
			effects: [
				{
					type: 'trigger',
					command: {
						type: 'server',
						action: { type: 'button-ready' },
					},
				},
			],
		}
	}

	if (state.stage.type === 'answer') {
		const callbackId: string = Math.random().toString(36).substring(7)

		const stage: (typeof state)['stage'] = {
			...state.stage,
			finishedMediaPlayers: [...state.stage.finishedMediaPlayers, command.playerId],
			callbackId,
		}

		if (stage.finishedMediaPlayers.length === 1) {
			return {
				state: { ...state, stage },
				effects: [
					{
						type: 'schedule',
						command: {
							type: 'server',
							action: {
								type: 'round-return',
								callbackId,
							},
						},
						delaySeconds: Timeouts.mediaReturnDelayAfterFinishedTimeout,
					},
				],
			}
		}

		const allPlayersFinished =
			stage.finishedMediaPlayers.length ===
			state.players.filter((p) => !p.disconnected).length

		if (allPlayersFinished) {
			return {
				state: { ...state, stage },
				effects: [
					{
						type: 'trigger',
						command: {
							type: 'server',
							action: { type: 'round-return', callbackId },
						},
					},
				],
			}
		}

		return { state: { ...state, stage } }
	}

	return {}
}

export default handleClientMediaFinished
