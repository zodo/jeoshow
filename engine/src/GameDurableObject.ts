import type { ClientAction } from 'shared/models/commands'
import type { GameState } from './game/state/models'
import type {
	ClientCommand,
	GameCommand,
	ScheduledCommand,
	ServerCommandOfType,
} from './game/state/state-machine-models'
import { updateState } from './game/state/state-machine'
import { initGame } from './game/create'

export class GameDurableObject {
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
		}

		return new Response('Not found', { status: 404 })
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		console.log('Received message:', message)
		const command: ClientCommand<ClientAction> = {
			type: 'client',
			playerId: this.state.getTags(ws)[0],
			action: JSON.parse(message as string),
		}
		await this.modifyState(command, ws)
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		ws.close(code, 'Durable Object is closing WebSocket')
		const userId = this.state.getTags(ws)[0]
		console.log('User disconnected:', userId)
		const command: ServerCommandOfType<'disconnect'> = {
			type: 'server',
			action: { type: 'disconnect', playerId: userId },
		}
		await this.modifyState(command, ws)
	}

	async alarm() {
		const now = Date.now()
		console.log('Alarm triggered, now', now)
		const scheduledCommands = (await this.storage.get('scheduledCommands')) as string
		const commands: ScheduledCommand[] = scheduledCommands ? JSON.parse(scheduledCommands) : []
		const commandsToExecute = commands.filter((c) => c.time <= now)
		for (const { command } of commandsToExecute) {
			await this.modifyState(command)
		}
		const remainingCommands = commands.filter((c) => c.time > now)
		if (remainingCommands.length > 0) {
			const closestTime = Math.min(...remainingCommands.map((c) => c.time))
			await this.storage.setAlarm(closestTime)
		}
		await this.storage.put('scheduledCommands', JSON.stringify(remainingCommands))
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
		await initGame({ state: this.state, env: this.env }, packId)
		return new Response(null, {
			status: 201,
			headers: {
				'Content-Type': 'application/json',
			},
		})
	}

	private async broadcast(event: any) {
		const clients = this.state.getWebSockets()
		for (const ws of clients) {
			ws.send(event)
		}
	}

	private async modifyState(command: GameCommand, ws?: WebSocket) {
		console.log('Modifying state:', command)
		const currentStateJson = (await this.storage.get('state')) as string
		const currentState = JSON.parse(currentStateJson) as GameState

		const { state, events } = updateState(currentState, command)
		if (state !== currentState) {
			this.storage.put('state', JSON.stringify(state))
		}

		for (const event of events) {
			if (event.type === 'broadcast') {
				this.broadcast(JSON.stringify(event.event))
			} else if (event.type === 'reply' && ws) {
				ws.send(JSON.stringify(event.event))
			} else if (event.type === 'schedule') {
				const scheduledCommands = (await this.storage.get('scheduledCommands')) as string
				const commands: ScheduledCommand[] = scheduledCommands
					? JSON.parse(scheduledCommands)
					: []
				const now = Date.now()
				commands.push({ command: event.command, time: now + event.delaySeconds * 1000 })
				const closestTime = Math.min(...commands.map((c) => c.time).filter((t) => t > now))
				console.log('Set alarm for:', closestTime)
				await this.storage.setAlarm(closestTime)
				await this.storage.put('scheduledCommands', JSON.stringify(commands))
			}
		}
	}
}
