import { ClientAction } from 'shared/models/commands'
import { GameState, Player, Stage, toSnapshot } from './models/state'
import { GameEvent, QuestionSubstate, StageSnapshot } from 'shared/models/events'

export type ServerCommand = {
	type: 'server'
	action: { type: 'disconnect'; playerId: string }
}

export type ClientCommand = {
	type: 'client'
	playerId: string
	action: ClientAction
}

export type GameCommand = ClientCommand | ServerCommand

type UpdateEvent = { type: 'broadcast'; event: GameEvent } | { type: 'reply'; event: GameEvent }

interface UpdateResult {
	state: GameState
	events: UpdateEvent[]
}

export const updateState = (state: GameState, command: GameCommand): UpdateResult => {
	switch (command.type) {
		case 'client':
			const playerId = command.playerId
			switch (command.action.type) {
				case 'Introduce':
					const existingPlayer = state.players.find((p) => p.id === playerId)
					const player: Player = {
						id: playerId,
						name: command.action.name,
						score: existingPlayer?.score || 0,
						disconnected: false,
					}
					const newPlayers = [...state.players.filter((p) => p.id !== playerId), player]

					return {
						state: { ...state, players: newPlayers },
						events: [
							{
								type: 'broadcast',
								event: { type: 'PlayersUpdated', players: newPlayers },
							},
							{
								type: 'reply',
								event: { type: 'StageUpdated', stage: toSnapshot(state.stage) },
							},
						],
					}
				case 'StartGame':
					const alivePlayers = state.players.filter((p) => !p.disconnected)
					const randomActivePlayer =
						alivePlayers[Math.floor(Math.random() * alivePlayers.length)]
					const ns: Stage = {
						type: 'Round',
						model: state.pack.rounds[0],
						takenQuestions: [],
						activePlayer: randomActivePlayer.id,
						previousAnswers: { answers: [], triedToAppeal: [] },
					}

					return {
						state: { ...state, stage: ns },
						events: [
							{
								type: 'broadcast',
								event: { type: 'StageUpdated', stage: toSnapshot(ns) },
							},
						],
					}

				case 'HitButton':
					let newStage = state.stage
					let events: UpdateEvent[] = []
					if (
						state.stage.type === 'ReadyForHit' &&
						!state.stage.previousAnswers.answers.some((a) => a.playerId === playerId)
					) {
						newStage = {
							...state.stage,
							type: 'AwaitingAnswer',
							answeringPlayer: playerId,
						}

						events.push({
							type: 'broadcast',
							event: { type: 'StageUpdated', stage: toSnapshot(newStage) },
						})
					}

					return {
						state: state,
						events: [
							{
								type: 'broadcast',
								event: { type: 'PlayerHitTheButton', playerId: playerId },
							},
							...events,
						],
					}
			}

		case 'server': {
			const sc = command as ServerCommand
			switch (sc.action.type) {
				case 'disconnect': {
					const player = state.players.find((p) => p.id === sc.action.playerId)
					if (!player) {
						return { state, events: [] }
					}
					const newPlayers = state.players.map((p) => {
						if (p.id === sc.action.playerId) {
							return { ...p, disconnected: true }
						}
						return p
					})
					return {
						state: { ...state, players: newPlayers },
						events: [
							{
								type: 'broadcast',
								event: { type: 'PlayersUpdated', players: newPlayers },
							},
						],
					}
				}
			}
		}
	}
}
