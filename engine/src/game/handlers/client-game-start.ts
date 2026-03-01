import type { GameState, Stage } from '../models/state'
import type { ClientCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { Timeouts } from '../timeouts'

const handleClientGameStart = (
	state: GameState,
	command: ClientCommand.OfType<'game-start'>,
	ctx: CommandContext
): UpdateResult => {
	const gameMode = command.action.gameMode
	const alivePlayers = state.players.filter((p) => !p.disconnected)
	const randomActivePlayer = alivePlayers[Math.floor(ctx.random() * alivePlayers.length)]
	const callbackId: string = ctx.random().toString(36).substring(7)
	const firstRoundId = ctx.pack.rounds[0].id
	const selectTimeout = gameMode === 'party' ? Timeouts.partySelectQuestion : Timeouts.selectQuestion
	const newStage: Stage = {
		type: 'round',
		paused: false,
		roundId: firstRoundId,
		takenQuestions: [],
		activePlayer: randomActivePlayer.id,
		previousAnswers: { answers: [], triedToAppeal: [] },
		callbackId,
		callbackTimeout: selectTimeout,
	}

	return {
		state: { ...state, gameMode, jackpot: 0, stage: newStage },
		effects: [
			{
				type: 'schedule',
				command: {
					type: 'server',
					action: { type: 'question-random', callbackId },
				},
				delaySeconds: selectTimeout,
			},
		],
	}
}

export default handleClientGameStart
