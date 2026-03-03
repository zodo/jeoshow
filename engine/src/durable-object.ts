import { updateState } from './game/state-update'
import { loadMetadata } from './game/metadata'
import { createState } from './game/state-create'
import { judgeLlm, judgeLlmBatch } from './game/llm-judge'
import { toSnapshot } from './game/state-utils'
import type {
	ClientCommand,
	GameCommand,
	ScheduledCommand,
	ServerCommand,
} from './game/models/state-commands'
import type { ClientAction } from 'shared/models/messages'
import type { GameState } from './game/models/state'
import type { CommandContext, UpdateEffect, UpdateResult } from './game/models/state-machine'

class GameDurableObjectSqlite {
	state: DurableObjectState
	storage: DurableObjectStorage
	env: CfEnv

	constructor(state: DurableObjectState, env: CfEnv) {
		this.state = state
		this.storage = state.storage
		this.env = env
		state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
	}

	async fetch(request: Request): Promise<Response> {
		console.log('Received request:', request.url, request.method)
		const url = new URL(request.url)
		if (url.pathname === '/ws') {
			return this.initiateWebSocket(request)
		} else if (url.pathname === '/create-game') {
			return this.createGame(request)
		} else if (url.pathname === '/get-game-info') {
			return this.getGameInfo(request)
		}

		return new Response('Not found', { status: 404 })
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		const command: ClientCommand<ClientAction> = {
			type: 'client',
			playerId: this.state.getTags(ws)[0],
			action: JSON.parse(message as string),
		}
		await this.modifyState(command, Date.now(), 'ws', ws)
	}

	async webSocketClose(webSocket: WebSocket, code: number, reason: string, wasClean: boolean) {
		console.log('WebSocket closed:', code, reason, wasClean)
		await this.onCloseOrError(webSocket)
	}

	async webSocketError(webSocket: WebSocket, error: Error) {
		console.error('WebSocket error:', error)
		await this.onCloseOrError(webSocket)
	}

	private async onCloseOrError(webSocket: WebSocket) {
		const userId = this.state.getTags(webSocket)[0]

		const websockets = this.state.getWebSockets()
		for (const ws of websockets) {
			if (
				ws !== webSocket &&
				ws.readyState === WebSocket.OPEN &&
				this.state.getTags(ws)[0] === userId
			) {
				console.log('Another connection exists for this user', userId)
				return
			}
		}

		const command: ServerCommand.OfType<'player-disconnect'> = {
			type: 'server',
			action: { type: 'player-disconnect', playerId: userId },
		}
		await this.modifyState(command, Date.now(), 'ws')
	}

	async alarm() {
		try {
			const now = Date.now()
			const commands: ScheduledCommand[] =
				(await this.storage.get('scheduledCommands')) ?? []
			const commandsToExecute = commands.filter((c) => c.time <= now)
			for (const { command } of commandsToExecute) {
				await this.modifyState(command, now, 'alarm')
			}
			if (commandsToExecute.length === 0) {
				console.warn(
					'Alarm triggered but no commands to execute',
					JSON.stringify({
						commands,
						now,
					})
				)
			}
		} catch (err) {
			console.error('Alarm handler exception:', err instanceof Error ? err.stack : err)
		}
	}

	private async initiateWebSocket(request: Request): Promise<Response> {
		const upgradeHeader = request.headers.get('Upgrade')
		if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
			return new Response('Expected WebSocket request', { status: 426 })
		}

		const gameState = await this.storage.get('state')
		if (!gameState) {
			return new Response('Game not found', { status: 404 })
		}

		const url = new URL(request.url)
		const userId = url.searchParams.get('userId')
		if (!userId) {
			return new Response('userId is required', { status: 400 })
		}

		const webSocketPair = new WebSocketPair()
		const [client, server] = Object.values(webSocketPair)

		this.state.acceptWebSocket(server, [userId])

		console.log('WebSocket initiated')

		return new Response(null, {
			status: 101,
			webSocket: client,
			headers: {
				'Access-Control-Allow-Origin': '*',
			},
		})
	}

	private async createGame(request: Request) {
		const body = (await request.json()) as any
		const packId = body.packId
		const { state, model } = await createState(this.env, packId)
		await this.state.storage.put('state', state)
		await this.state.storage.put('packId', packId)
		await this.modifyScheduledCommands(Date.now(), () => [
			{
				command: { type: 'server', action: { type: 'state-cleanup' } },
				time: Date.now() + 60 * 60 * 1000,
			},
		])
		return new Response(
			JSON.stringify({
				packName: model.name,
			}),
			{
				status: 201,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
	}

	private async broadcast(event: any) {
		const clients = this.state.getWebSockets()
		for (const ws of clients) {
			ws.send(event)
		}
	}

	private async modifyState(
		command: GameCommand,
		now: number,
		origin: 'ws' | 'alarm' | 'llm',
		ws?: WebSocket
	) {
		if (command.type === 'server' && command.action.type === 'state-cleanup') {
			if (this.state.getWebSockets().length === 0) {
				await this.cleanup()
				return
			}
		}
		const packId: string | undefined = await this.storage.get('packId')
		if (!packId) {
			console.error('PackId not found')
			return
		}
		const packMetadata = await loadMetadata(this.env.JEOSHOW_PACKS_METADATA, packId)
		if (!packMetadata) {
			console.error('Metadata not found')
			return
		}
		const ctx: CommandContext = {
			pack: packMetadata.model,
			mediaMapping: packMetadata.mediaMapping,
			now,
			random: Math.random,
		}
		const txResult = await this.storage.transaction(async (txn) => {
			const before: GameState | undefined = await txn.get('state')
			if (!before) {
				console.error('State not found')
				return
			}

			const { state: after, effects } = this.recursivelyUpdateState(before, command, ctx)

			const finalState = after ?? before
			await txn.put('state', finalState)

			console.log(
				`<- ${origin}.${command.type}.${command.action.type}`,
				JSON.stringify({
					command,
					now,
					effects,
					state: {
						before,
						after: finalState,
					},
				})
			)

			return { effects, before, after: finalState }
		})

		if (!txResult) return
		const { effects, before, after } = txResult

		const replyEvents =
			effects
				?.filter(
					(e): e is Extract<UpdateEffect, { type: 'client-reply' }> =>
						e.type === 'client-reply'
				)
				.map((e) => e.event) ?? []
		if (replyEvents.length > 0 && ws) {
			ws.send(JSON.stringify(replyEvents))
		}

		const broadcastEvents =
			effects
				?.filter(
					(e): e is Extract<UpdateEffect, { type: 'client-broadcast' }> =>
						e.type === 'client-broadcast'
				)
				.map((e) => e.event) ?? []

		// Auto-broadcast stage-updated and players-updated by diffing before/after
		if (before.stage !== after.stage) {
			broadcastEvents.push({
				type: 'stage-updated',
				stage: toSnapshot(after, ctx),
			})
		}
		if (before.players !== after.players) {
			broadcastEvents.push({
				type: 'players-updated',
				players: after.players,
			})
		}

		if (broadcastEvents.length > 0) {
			await this.broadcast(JSON.stringify(broadcastEvents))
		}

		const scheduledCommands =
			effects?.filter(
				(e): e is Extract<UpdateEffect, { type: 'schedule' }> => e.type === 'schedule'
			) ?? []
		if (scheduledCommands.length > 0 || origin === 'alarm') {
			await this.modifyScheduledCommands(now, (commands) => {
				return [
					...commands.filter((c) => c.time > now),
					...scheduledCommands.map((event) => ({
						command: event.command,
						time: Math.ceil(now + event.delaySeconds * 1000),
					})),
				]
			})
		}

		const llmJudgeEffects =
			effects?.filter(
				(e): e is Extract<UpdateEffect, { type: 'llm-judge' }> => e.type === 'llm-judge'
			) ?? []
		for (const effect of llmJudgeEffects) {
			const apiKey = this.env.OPENROUTER_API_KEY
			if (!apiKey) {
				console.error('OPENROUTER_API_KEY not configured, falling back to incorrect')
				continue
			}
			judgeLlm(apiKey, {
				questionText: effect.questionText,
				theme: effect.theme,
				correctAnswers: effect.correctAnswers,
				incorrectAnswers: effect.incorrectAnswers,
				playerAnswer: effect.playerAnswer,
			}).then((correct) => {
				this.modifyState(
					{
						type: 'server',
						action: { type: 'llm-verdict', correct, callbackId: effect.callbackId },
					},
					Date.now(),
					'llm'
				)
			})
		}

		const llmBatchEffects =
			effects?.filter(
				(e): e is Extract<UpdateEffect, { type: 'llm-judge-batch' }> =>
					e.type === 'llm-judge-batch'
			) ?? []
		for (const effect of llmBatchEffects) {
			const apiKey = this.env.OPENROUTER_API_KEY
			if (!apiKey) {
				console.error('OPENROUTER_API_KEY not configured, falling back to incorrect')
				continue
			}
			judgeLlmBatch(
				apiKey,
				effect.entries.map((entry) => ({
					playerId: entry.playerId,
					questionText: entry.questionText,
					theme: entry.theme,
					correctAnswers: entry.correctAnswers,
					incorrectAnswers: entry.incorrectAnswers,
					playerAnswer: entry.playerAnswer,
				}))
			).then((results) => {
				for (const [playerId, correct] of Object.entries(results)) {
					this.modifyState(
						{
							type: 'server',
							action: {
								type: 'party-llm-verdict',
								playerId,
								correct,
								callbackId: effect.callbackId,
							},
						},
						Date.now(),
						'llm'
					)
				}
			})
		}
	}

	private recursivelyUpdateState(
		state: GameState,
		command: GameCommand,
		ctx: CommandContext,
		depth = 0
	): UpdateResult {
		if (depth > 10) {
			throw new Error(`Likely infinite loop: ${depth}, command: ${JSON.stringify(command)}`)
		}

		const { state: updatedState, effects: events } = updateState(state, command, ctx)

		const triggerEvents =
			events?.filter(
				(e): e is Extract<UpdateEffect, { type: 'trigger' }> => e.type === 'trigger'
			) ?? []

		const nonTriggerEvents: UpdateEffect[] = events?.filter((e) => e.type !== 'trigger') ?? []

		const finalState = triggerEvents.reduce<GameState>((currentState, event) => {
			console.log('-> trigger:', event.command.type, event.command.action.type)
			const result = this.recursivelyUpdateState(currentState, event.command, ctx, depth + 1)
			nonTriggerEvents.push(...(result.effects ?? []))
			return result.state ?? currentState
		}, updatedState ?? state)

		return { state: finalState, effects: nonTriggerEvents }
	}

	private async modifyScheduledCommands(
		now: number,
		modifier: (commands: ScheduledCommand[]) => ScheduledCommand[]
	) {
		let commands: ScheduledCommand[] = (await this.storage.get('scheduledCommands')) ?? []
		commands = modifier(commands)
		const closestTime = Math.min(...commands.map((c) => c.time).filter((t) => t > now))
		if (closestTime !== Infinity) {
			await this.storage.setAlarm(closestTime)
		}
		await this.storage.put('scheduledCommands', commands)
	}

	private async cleanup() {
		console.log('Cleaning up')
		await this.storage.deleteAlarm()
		await this.storage.delete('state')
		await this.storage.delete('scheduledCommands')
		await this.storage.delete('packId')
	}

	private async getGameInfo(request: Request): Promise<Response> {
		const body = (await request.json()) as any
		const userId = body.userId
		const currentState: GameState | undefined = await this.storage.get('state')
		const gameExists = !!currentState
		const playerName = userId
			? currentState?.players?.find((p) => p.id === userId)?.name
			: undefined
		return new Response(
			JSON.stringify({
				playerName,
				gameExists,
			}),
			{
				status: 200,
				headers: {
					'Content-Type': 'application/json',
				},
			}
		)
	}
}

export default GameDurableObjectSqlite
