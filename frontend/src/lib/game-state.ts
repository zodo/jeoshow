import type { GameEvent } from 'shared/models/messages'
import type { Player, StageSnapshot } from 'shared/models/models'
import type { PackModel } from 'shared/models/siq'
import { derived, readable, writable, type Readable } from 'svelte/store'
import type { HapticType, PlayerButtonHit, ViewState } from './models'
import { dev } from '$app/environment'

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
	private playerAnswerAttempt = writable<{
		playerId: string
		answer: string
		correct: boolean
	} | null>(null)

	private activePlayerId = derived(this.stage, ($stage) => {
		if ($stage?.type === 'round' && !$stage.appealVoting) {
			return $stage.activePlayerId
		} else if ($stage?.type === 'question' && $stage.substate.type === 'awaiting-answer') {
			return $stage.substate.activePlayerId
		} else if ($stage?.type === 'round' && $stage.appealVoting?.playerId) {
			return $stage.appealVoting.playerId
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

	private showQuestionIntroduction = readable(false, (set) => {
		let inRound = false
		this.stage.subscribe((stage) => {
			if (stage?.type === 'question' && inRound) {
				set(true)
				setTimeout(() => set(false), 1500)
				inRound = false
			}

			inRound = stage?.type === 'round'
		})
	})

	private controls: Readable<ViewState.Controls> = derived(
		[
			this.stage,
			this.falselyStartedThisQuestion,
			this.playerAnswerAttempt,
			this.extendedPlayers,
		],
		([$stage, $falselyStartedThisQuestion, $playerAnswerAttempt, $players]) => {
			if ($playerAnswerAttempt && $playerAnswerAttempt.playerId === this.userId) {
				return { mode: 'answer-attempt', correct: $playerAnswerAttempt.correct } as const
			} else if (
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
				$stage?.type === 'round' &&
				$stage.playerIdsCanAppeal.includes(this.userId)
			) {
				return { mode: 'appeal' } as const
			} else if ($stage?.type === 'answer' && $stage.canSkip) {
				return {
					mode: 'answer-skip',
					totalPlayers: $players.filter((p) => !p.disconnected).length,
					votes: $stage.votedForSkip.length,
					meVoted: $stage.votedForSkip.includes(this.userId),
				} as const
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
			this.playerAnswerAttempt,
			this.showQuestionIntroduction,
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
			$playerAnswerAttempt,
			$showQuestionIntroduction,
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
						skipRoundVoting: serverStage.skipRoundVoting
							? {
									yes: serverStage.skipRoundVoting.yes.map(
										(playerId) => getPlayer(playerId)?.name ?? 'Unknown'
									),
									no: serverStage.skipRoundVoting.no.map(
										(playerId) => getPlayer(playerId)?.name ?? 'Unknown'
									),
									timeoutSeconds: serverStage.skipRoundVoting.timeoutSeconds,
									meVoted:
										serverStage.skipRoundVoting.yes.includes(this.userId) ||
										serverStage.skipRoundVoting.no.includes(this.userId),
								}
							: undefined,
						appealVoting: serverStage.appealVoting
							? {
									correctAnswers:
										serverStage.appealVoting.question.answers.type === 'regular'
											? serverStage.appealVoting.question.answers.correct
											: [],
									answer: serverStage.appealVoting.answer,
									playerName:
										getPlayer(serverStage.appealVoting.playerId)?.name ??
										'Unknown',
									agree: serverStage.appealVoting.agree.map(
										(playerId) => getPlayer(playerId)?.name ?? 'Unknown'
									),
									disagree: serverStage.appealVoting.disagree.map(
										(playerId) => getPlayer(playerId)?.name ?? 'Unknown'
									),
									timeoutSeconds: serverStage.appealVoting.timeoutSeconds,
									meVoted:
										serverStage.appealVoting.agree.includes(this.userId) ||
										serverStage.appealVoting.disagree.includes(this.userId),
								}
							: undefined,
						appealResolution: serverStage.appealResolution,
					}
					break
				}
				case 'question': {
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
						awaitingAnswerTimeoutSeconds:
							serverStage.substate.type === 'awaiting-answer' &&
							serverStage.substate.activePlayerId === this.userId
								? serverStage.substate.timeoutSeconds
								: undefined,
						showIntroduction: $showQuestionIntroduction,
						price: serverStage.price,
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
				case 'after-finish': {
					stage = { type: 'after-finish' }
					break
				}
			}

			let answerAttempt: ViewState.AnswerAttempt | undefined = undefined
			if ($playerAnswerAttempt) {
				const activePlayer = $playerAnswerAttempt.playerId
				const player = getPlayer(activePlayer)
				answerAttempt = {
					type: $playerAnswerAttempt.correct ? 'correct' : 'incorrect',
					playerName: player?.name ?? 'Unknown',
					avatarUrl: player?.avatarUrl,
					answer: $playerAnswerAttempt.answer,
					isMe: $playerAnswerAttempt.playerId === this.userId,
				}
			} else if (
				serverStage.type === 'question' &&
				serverStage.substate.type === 'awaiting-answer'
			) {
				const activePlayer = serverStage.substate.activePlayerId
				const player = getPlayer(activePlayer)
				answerAttempt = {
					type: 'in-progress',
					playerName: player?.name ?? 'Unknown',
					avatarUrl: player?.avatarUrl,
					answer: $playerAnswerTyping ?? '',
					isMe: serverStage.substate.activePlayerId === this.userId,
				}
			}

			const result: ViewState.View = {
				disconnected: !$connected,
				showPlayers: $showPlayers,
				players: $extendedPlayers,
				controls: $controls,
				stageBlink: $stageBlink,
				stage: stage,
				answerAttempt,
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
				break
			case 'answer-attempt':
				this.playerAnswerAttempt.set({
					playerId: event.playerId,
					answer: event.answer,
					correct: event.correct,
				})
				setTimeout(() => this.playerAnswerAttempt.set(null), 2500)
				break
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

export const modifyMediaUrl = (url: string) => {
	if (url.startsWith('http')) {
		return url
	}
	if (dev) {
		return `/resources/packs/${url}`
	}
	const encodedPath = encodeURIComponent(`packs/${url}`)
	return `https://content.jeoshow.220400.xyz/${encodedPath}`
}
