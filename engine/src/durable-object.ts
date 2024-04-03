import { updateState } from './game/state-update'
import { loadMetadata, type PackMetadata } from './game/metadata'
import { createState } from './game/state-create'
import type {
	ClientCommand,
	GameCommand,
	ScheduledCommand,
	ServerCommand,
} from './game/models/state-commands'
import type { ClientAction } from 'shared/models/messages'
import type { GameState } from './game/models/state'
import type { UpdateEffect, UpdateResult } from './game/models/state-machine'

class GameDurableObject {
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
		console.log('<- ws:', command.type, command.action.type)
		await this.modifyState(command, Date.now(), 'ws', ws)
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		const closeCode = code === 1005 ? 1000 : code
		ws.close(closeCode, 'Durable Object is closing WebSocket')
		const userId = this.state.getTags(ws)[0]
		const command: ServerCommand.OfType<'player-disconnect'> = {
			type: 'server',
			action: { type: 'player-disconnect', playerId: userId },
		}
		console.log('<- ws close:', command.type, command.action.type)
		await this.modifyState(command, Date.now(), 'ws', ws)
	}

	async alarm() {
		const now = Date.now()
		const commands: ScheduledCommand[] = (await this.storage.get('scheduledCommands')) ?? []
		const commandsToExecute = commands.filter((c) => c.time <= now)
		for (const { command, time } of commandsToExecute) {
			console.log('<- alarm:', command.type, command.action.type, time)
			await this.modifyState(command, now, 'alarm')
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
		origin: 'ws' | 'alarm',
		ws?: WebSocket
	) {
		if (command.type === 'server' && command.action.type === 'state-cleanup') {
			if (this.state.getWebSockets().length === 0) {
				await this.cleanup()
				return
			}
		}
		const currentState: GameState | undefined = await this.storage.get('state')
		if (!currentState) {
			console.error('State not found')
			return
		}
		const packMetadata = await loadMetadata(
			this.env.JEOSHOW_PACKS_METADATA,
			currentState.packId
		)
		if (!packMetadata) {
			console.error('Metadata not found')
			return
		}
		const { state, effects: events } = this.recursivelyUpdateState(
			currentState,
			command,
			packMetadata
		)

		if (state && state !== currentState) {
			await this.storage.put('state', state)
		}

		for (const event of events ?? []) {
			if (event.type === 'client-broadcast') {
				console.log('-> broadcast:', event.type, event.event.type)
				await this.broadcast(JSON.stringify(event.event))
			} else if (event.type === 'client-reply' && ws) {
				console.log('-> reply:', event.type)
				ws.send(JSON.stringify(event.event))
			}
		}

		const scheduledCommands =
			events?.filter(
				(e): e is Extract<UpdateEffect, { type: 'schedule' }> => e.type === 'schedule'
			) ?? []
		for (const event of scheduledCommands) {
			console.log(
				'-> schedule:',
				event.command.type,
				event.command.action.type,
				event.delaySeconds
			)
		}
		if (scheduledCommands.length > 0 || origin === 'alarm') {
			await this.modifyScheduledCommands(now, (commands) => {
				return [
					...commands.filter((c) => c.time > now),
					...scheduledCommands.map((event) => ({
						command: event.command,
						time: now + event.delaySeconds * 1000,
					})),
				]
			})
		}
	}

	private recursivelyUpdateState(
		state: GameState,
		command: GameCommand,
		packMetadata: PackMetadata,
		depth = 0
	): UpdateResult {
		if (depth > 10) {
			throw new Error(`Likely infinite loop: ${depth}, command: ${JSON.stringify(command)}`)
		}

		const { state: updatedState, effects: events } = updateState(state, command, {
			pack: packMetadata.model,
			mediaMapping: packMetadata.mediaMapping,
		})

		const triggerEvents =
			events?.filter(
				(e): e is Extract<UpdateEffect, { type: 'trigger' }> => e.type === 'trigger'
			) ?? []

		const nonTriggerEvents = events?.filter((e) => e.type !== 'trigger') ?? []

		const finalState = triggerEvents.reduce<GameState>((currentState, event) => {
			console.log('-> trigger:', event.command.type, event.command.action.type)
			const result = this.recursivelyUpdateState(
				currentState,
				event.command,
				packMetadata,
				depth + 1
			)
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
	}

	private async getGameInfo(request: Request): Promise<Response> {
		const body = (await request.json()) as any
		const userId = body.userId
		if (!userId) {
			return new Response('userId is required', { status: 400 })
		}

		const currentState: GameState | undefined = await this.storage.get('state')
		const gameExists = !!currentState
		const playerName = currentState?.players?.find((p) => p.id === userId)?.name
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

export default GameDurableObject
