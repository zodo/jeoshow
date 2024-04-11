import type { Player } from 'shared/models/models'
import type { GameState } from '../models/state'
import type { ServerCommand } from '../models/state-commands'
import type { CommandContext, UpdateResult } from '../models/state-machine'
import { goToAwaitingAnswer } from './client-button-hit'

const handleServerButtonHitChoose = (
	state: GameState,
	command: ServerCommand.OfType<'button-hit-choose'>,
	ctx: CommandContext
): UpdateResult => {
	if (state.stage.type !== 'ready-for-hit') {
		return { state, effects: [] }
	}

	const playerIds = state.stage.playersWhoHit
	const attemptedPlayers = state.players.filter((p) => playerIds.includes(p.id))
	const winner = chooseRandomPlayer(attemptedPlayers)

	if (winner) {
		return goToAwaitingAnswer(state, ctx, winner.id)
	} else {
		return {
			state: {
				...state,
				stage: {
					...state.stage,
					randomizeHits: false,
					playersWhoHit: [],
				},
			},
		}
	}
}

const chooseRandomPlayer = (players: Player[]): Player | null => {
	if (players.length === 0) {
		return null
	}

	const maxAnswers = Math.max(...players.map((player) => player.answerAttemts))

	const weights = players.map((player) => maxAnswers + 1 - player.answerAttemts)
	const totalWeight = weights.reduce((acc, weight) => acc + weight, 0)
	let randomNum = Math.random() * totalWeight

	for (let i = 0; i < players.length; i++) {
		randomNum -= weights[i]
		if (randomNum < 0) {
			console.log(
				'choosing random player',
				JSON.stringify({
					players: players.map((player, i) => ({
						name: player.name,
						attempts: player.answerAttemts,
						weight: weights[i],
					})),
					totalWeight,
					randomNum,
					winner: players[i].name,
				})
			)
			return players[i]
		}
	}

	// This should never happen if the function is correctly implemented
	console.error(
		'Failed to choose random player',
		JSON.stringify({ players, totalWeight, randomNum })
	)
	return null
}

export default handleServerButtonHitChoose
