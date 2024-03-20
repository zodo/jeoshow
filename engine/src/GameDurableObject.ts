import { ClientAction } from 'shared/models/commands'
import { initGame } from './game/create'
import { ClientCommand, GameCommand, ServerCommand, updateState } from './game/state-machine'
import { GameState } from './game/models/state'

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
		const command: ClientCommand = {
			type: 'client',
			playerId: this.state.getTags(ws)[0],
			action: JSON.parse(message as string) as ClientAction,
		}
		await this.modifyState(command, ws)
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		ws.close(code, 'Durable Object is closing WebSocket')
		const userId = this.state.getTags(ws)[0]
		console.log('User disconnected:', userId)
		const command: ServerCommand = {
			type: 'server',
			action: { type: 'disconnect', playerId: userId },
		}
		await this.modifyState(command, ws)
	}

	async alarm() {
		console.log('Alarm, inc')
		this.storage.setAlarm(Date.now() + 1000)
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
			}
		}
	}
}
