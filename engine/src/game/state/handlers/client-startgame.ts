import { toSnapshot, type GameState, type Stage } from '../models'
import type { ClientCommandOfType, UpdateResult } from '../state-machine-models'

const handleClientStartGame = (
	state: GameState,
	command: ClientCommandOfType<'StartGame'>
): UpdateResult => {
	const alivePlayers = state.players.filter((p) => !p.disconnected)
	const randomActivePlayer = alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
	const newStage: Stage = {
		type: 'Round',
		roundModel: state.pack.rounds[Math.floor(Math.random() * state.pack.rounds.length)],
		takenQuestions: [],
		activePlayer: randomActivePlayer.id,
		previousAnswers: { answers: [], triedToAppeal: [] },
	}

	return {
		state: { ...state, stage: newStage },
		events: [
			{
				type: 'broadcast',
				event: { type: 'StageUpdated', stage: toSnapshot(newStage) },
			},
		],
	}
}

export default handleClientStartGame
