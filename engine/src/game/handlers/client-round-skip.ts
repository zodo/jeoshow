import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { toSnapshot } from '../state-utils'
import { Timeouts } from '../timeouts'

const handleRoundSkip = (
	state: GameState,
	command: ClientCommand.OfType<'round-skip'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'round') {
		return { state, effects: [] }
	}
	let yesVotes = state.stage.skipRoundVoting?.yes ?? []
	let noVotes = state.stage.skipRoundVoting?.no ?? []

	if (yesVotes.includes(command.playerId) || noVotes.includes(command.playerId)) {
		return { state, effects: [] }
	}

	if (command.action.vote === 'yes') {
		yesVotes = [...yesVotes, command.playerId]
	} else {
		noVotes = [...noVotes, command.playerId]
	}
	const callbackId = Math.random().toString(36).substring(7)

	if (yesVotes.length + noVotes.length === state.players.filter((p) => !p.disconnected).length) {
		if (yesVotes.length > noVotes.length) {
			const stage = { ...state.stage, skipRoundVoting: undefined, callbackId }
			return {
				state: { ...state, stage },
				effects: [
					{
						type: 'trigger',
						command: {
							type: 'server',
							action: { type: 'round-return', forceNextRound: true, callbackId },
						},
					},
				],
			}
		} else {
			const stage = { ...state.stage, skipRoundVoting: undefined }
			return {
				state: { ...state, stage },
				effects: [
					{
						type: 'client-broadcast',
						event: { type: 'stage-updated', stage: toSnapshot(stage, ctx) },
					},
				],
			}
		}
	} else {
		const isJustStarted = yesVotes.length + noVotes.length === 1

		const stage: Extract<Stage, { type: 'round' }> = {
			...state.stage,
			skipRoundVoting: {
				yes: yesVotes,
				no: noVotes,
				timeoutSeconds: Timeouts.roundSkipVoting,
			},
			...(isJustStarted && { callbackId }),
		}

		return {
			state: { ...state, stage },
			effects: [
				{
					type: 'client-broadcast',
					event: { type: 'stage-updated', stage: toSnapshot(stage, ctx) },
				},
				...(isJustStarted
					? [
							{
								type: 'schedule',
								command: {
									type: 'server',
									action: {
										type: 'round-return',
										callbackId,
									},
								},
								delaySeconds: Timeouts.roundSkipVoting,
							} as const,
						]
					: []),
			],
		}
	}
}

export default handleRoundSkip
