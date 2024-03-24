import { toSnapshot, type GameState, type Stage } from '../models'
import type { ClientCommandOfType, CommandContext, UpdateResult } from '../state-machine-models'
import { Timeouts } from '../timeouts'

const handleClientGameStart = (
	state: GameState,
	command: ClientCommandOfType<'game-start'>,
	ctx: CommandContext
): UpdateResult => {
	const alivePlayers = state.players.filter((p) => !p.disconnected)
	const randomActivePlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
	const callbackId: string = Math.random().toString(36).substring(7)
	const firstRoundId = ctx.pack.rounds[0].id
	const newStage: Stage = {
		type: 'round',
		roundId: firstRoundId,
		takenQuestions: [],
		activePlayer: randomActivePlayer.id,
		previousAnswers: { answers: [], triedToAppeal: [] },
		callbackId,
		callbackTimeout: Timeouts.selectQuestion,
	}

	return {
		state: { ...state, stage: newStage },
		events: [
			{
				type: 'client-broadcast',
				event: { type: 'stage-updated', stage: toSnapshot(newStage, ctx) },
			},
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: { type: 'question-random', callbackId },
				},
				delaySeconds: Timeouts.selectQuestion,
			},
		],
	}
}

export default handleClientGameStart
