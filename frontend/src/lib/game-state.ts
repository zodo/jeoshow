import type { GameEvent } from 'shared/models/messages'
import type { Player, StageSnapshot } from 'shared/models/models'
import type { PackModel } from 'shared/models/siq'
import { derived, readable, writable, type Readable } from 'svelte/store'
import type { HapticType, PlayerButtonHit, ViewState } from './models'

export class GameState {
	userId: string

	constructor(userId: string) {
		this.userId = userId
	}

	private players = writable<Player[]>([])
	private stage = writable<StageSnapshot | null>(null)
	private hitButton = writable<PlayerButtonHit[]>([])
	private playerAnswerTyping = writable<string | null>(null)
	private connected = writable(true)
	private showPlayers = writable(false)

	private activePlayerId = derived(this.stage, ($stage) => {
		if ($stage?.type === 'round') {
			return $stage.activePlayerId
		} else if ($stage?.type === 'question' && $stage.substate.type === 'awaiting-answer') {
			return $stage.substate.activePlayerId
		} else if ($stage?.type === 'appeal') {
			return $stage.playerId
		}
		return null
	})

	private extendedPlayers = derived(
		[this.players, this.activePlayerId, this.hitButton],
		([$players, $activePlayerId, $hitButton]) => {
			return $players
				.map((player) => ({
					...player,
					pressedButton: $hitButton.find((b) => b.playerId === player.id)?.type ?? null,
					active: $activePlayerId === player.id,
				}))
				.sort((a, b) => {
					if (a.active && !b.active) return -1
					if (!a.active && b.active) return 1
					return b.score - a.score
				})
		}
	)

	private falselyStartedThisQuestion = readable(false, (set) => {
		this.stage.subscribe((stage) => {
			if (stage?.type !== 'question' || stage.substate.type !== 'idle') {
				set(false)
			}
		})
		this.hitButton.subscribe((hitButton) => {
			if (hitButton.some((b) => b.type === 'false-start' && b.playerId === this.userId)) {
				set(true)
			}
		})
	})

	private controls: Readable<ViewState.Controls> = derived(
		[this.stage, this.falselyStartedThisQuestion],
		([$stage, $falselyStartedThisQuestion]) => {
			if (
				$stage?.type === 'question' &&
				$stage.substate.type === 'awaiting-answer' &&
				$stage.substate.activePlayerId === this.userId
			) {
				if ($stage.selectAnswerOptions) {
					return { mode: 'answer-select', options: $stage.selectAnswerOptions } as const
				} else {
					return { mode: 'answer-text' } as const
				}
			} else if (
				$stage?.type === 'question' &&
				$stage.substate.type === 'answer-attempt' &&
				$stage.substate.activePlayerId === this.userId
			) {
				return { mode: 'answer-attempt', correct: $stage.substate.correct } as const
			} else if (
				$stage?.type === 'round' &&
				$stage.playerIdsCanAppeal.includes(this.userId)
			) {
				return { mode: 'appeal' } as const
			} else {
				return {
					mode: 'hit',
					ready: $stage?.type === 'question' && $stage.substate.type === 'ready-for-hit',
					falselyStart: $falselyStartedThisQuestion,
				} as const
			}
		}
	)

	private stageBlink = readable(false, (set) => {
		let readyForBlinkOnReady = false
		let blinkOnRoundAndActivePlayerInterval: NodeJS.Timeout | undefined
		this.stage.subscribe((stage) => {
			if (stage?.type === 'question' && stage.substate.type === 'ready-for-hit') {
				if (readyForBlinkOnReady) {
					set(true)
					readyForBlinkOnReady = false
					setTimeout(() => set(false), 100)
				}
			} else {
				readyForBlinkOnReady = true
			}
			if (
				stage?.type === 'round' &&
				stage.activePlayerId === this.userId &&
				!blinkOnRoundAndActivePlayerInterval
			) {
				blinkOnRoundAndActivePlayerInterval = setInterval(() => {
					set(true)
					setTimeout(() => set(false), 100)
					setTimeout(() => set(true), 300)
					setTimeout(() => set(false), 400)
				}, 15000)
			} else {
				clearInterval(blinkOnRoundAndActivePlayerInterval)
				blinkOnRoundAndActivePlayerInterval = undefined
			}
		})
	})

	viewState: Readable<ViewState.View> = derived(
		[
			this.extendedPlayers,
			this.stage,
			this.playerAnswerTyping,
			this.connected,
			this.showPlayers,
			this.activePlayerId,
			this.controls,
			this.stageBlink,
		],
		([
			$extendedPlayers,
			$stage,
			$playerAnswerTyping,
			$connected,
			$showPlayers,
			$activePlayerId,
			$controls,
			$stageBlink,
		]) => {
			const getPlayer = (playerId: string) => $extendedPlayers.find((p) => p.id === playerId)

			let stage: ViewState.View['stage']
			const serverStage = $stage ?? { type: 'connecting' }
			switch (serverStage.type) {
				case 'connecting': {
					stage = { type: 'connecting' }
					break
				}
				case 'before-start': {
					stage = { type: 'before-start' }
					break
				}
				case 'round': {
					stage = {
						type: 'round',
						name: serverStage.name,
						comments: serverStage.comments,
						themes: serverStage.themes.map((theme) => ({
							name: theme.name,
							questions: theme.questions.map((question) => ({
								id: question.id,
								price: question.price,
								available: question.available,
							})),
						})),
						meActive: $activePlayerId === this.userId,
					}
					break
				}
				case 'question': {
					let awaitingAnswer: ViewState.QuestionAwaitingAnswer | undefined = undefined
					if (serverStage.substate.type === 'awaiting-answer') {
						const activePlayer = serverStage.substate.activePlayerId
						const player = getPlayer(activePlayer)
						awaitingAnswer = {
							type: 'in-progress',
							playerName: player?.name ?? 'Unknown',
							avatarUrl: player?.avatarUrl,
							answer: $playerAnswerTyping ?? '',
							isMe: activePlayer === this.userId,
							timeoutSeconds: serverStage.substate.timeoutSeconds,
						}
					} else if (serverStage.substate.type === 'answer-attempt') {
						const activePlayer = serverStage.substate.activePlayerId
						const player = getPlayer(activePlayer)
						awaitingAnswer = {
							type: serverStage.substate.correct ? 'correct' : 'incorrect',
							playerName: player?.name ?? 'Unknown',
							avatarUrl: player?.avatarUrl,
							answer: serverStage.substate.answer,
							isMe: activePlayer === this.userId,
							timeoutSeconds: 4,
						}
					}

					let fragments: PackModel.FragmentGroup[] = serverStage.fragments
					if (serverStage.selectAnswerOptions) {
						fragments = [
							...fragments,

							serverStage.selectAnswerOptions.map((option) => ({
								type: 'text',
								value: `${option.name}. ${option.text}`,
							})),
						]
					}

					stage = {
						type: 'question',
						fragments: fragments,
						theme: serverStage.theme,
						themeComment: serverStage.themeComment,
						readyForHit:
							serverStage.substate.type === 'ready-for-hit'
								? {
										ready: true,
										timeoutSeconds: serverStage.substate.timeoutSeconds,
									}
								: undefined,
						awaitingAnswer: awaitingAnswer,
					}
					break
				}
				case 'answer': {
					stage = {
						type: 'answer',
						theme: serverStage.theme,
						model: serverStage.model,
					}
					break
				}
				case 'appeal': {
					stage = {
						type: 'appeal',
						model: serverStage.model,
						answer: serverStage.answer,
						playerName: getPlayer(serverStage.playerId)?.name ?? 'Unknown',
						agreePlayers: serverStage.resolutions
							.filter((r) => r.resolution)
							.map((r) => getPlayer(r.playerId)?.name ?? 'Unknown'),
						disagreePlayers: serverStage.resolutions
							.filter((r) => !r.resolution)
							.map((r) => getPlayer(r.playerId)?.name ?? 'Unknown'),
						timeoutSeconds: serverStage.timeoutSeconds,
						isMe: serverStage.playerId === this.userId,
					}
					break
				}
				case 'appeal-result': {
					stage = {
						type: 'appeal-result',
						resolution: serverStage.resolution,
					}
					break
				}
				case 'after-finish': {
					stage = { type: 'after-finish' }
					break
				}
			}

			const result: ViewState.View = {
				disconnected: !$connected,
				showPlayers: $showPlayers,
				players: $extendedPlayers,
				controls: $controls,
				stageBlink: $stageBlink,
				stage: stage,
			}
			return result
		}
	)

	handleGameEvent = (event: GameEvent) => {
		switch (event.type) {
			case 'players-updated':
				this.players.set(event.players)
				break
			case 'stage-updated':
				this.stage.set(event.stage)
				if (
					event.stage.type !== 'question' ||
					event.stage.substate.type !== 'awaiting-answer'
				) {
					this.playerAnswerTyping.set(null)
				}
				break
			case 'player-hit-the-button':
			case 'player-false-start': {
				const type = event.type === 'player-hit-the-button' ? 'hit' : 'false-start'
				this.hitButton.update((players) => [...players, { playerId: event.playerId, type }])
				setTimeout(() => {
					this.hitButton.update((players) =>
						players.filter((p) => p.playerId !== event.playerId)
					)
				}, 100)
				break
			}
			case 'player-typing':
				this.playerAnswerTyping.set(event.value)
		}
	}

	addHapticListener = (listener: (haptic: HapticType) => void) => {
		this.stageBlink.subscribe((blink) => {
			if (blink) {
				listener('medium')
			}
		})
	}

	setConnected = (connected: boolean) => {
		this.connected.set(connected)
	}

	setShowPlayers = (showPlayers: boolean) => {
		this.showPlayers.set(showPlayers)
	}
}
