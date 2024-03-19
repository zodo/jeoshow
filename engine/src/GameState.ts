export class GameState {
	state: DurableObjectState
	storage: DurableObjectStorage

	constructor(state: DurableObjectState, env: CfEnv) {
		this.state = state
		this.storage = state.storage
		state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'))
	}

	async fetch(request: Request): Promise<Response> {
		if (request.url.endsWith('/ws')) {
			const upgradeHeader = request.headers.get('Upgrade')
			if (!upgradeHeader || upgradeHeader.toLowerCase() !== 'websocket') {
				return new Response('Expected WebSocket request', { status: 426 })
			}

			const webSocketPair = new WebSocketPair()
			const [client, server] = Object.values(webSocketPair)

			this.state.acceptWebSocket(server)

			console.log('Accepted WebSocket connection')

			return new Response(null, {
				status: 101,
				webSocket: client,
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			})
		} else if (request.url.endsWith('/get-connections')) {
			const numConnections = this.state.getWebSockets().length
			return new Response(`Number of connections: ${numConnections}`, {
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			})
		} else if (request.url.endsWith('/count')) {
			const count: number = (await this.storage.get('count')) || 0
			return new Response(JSON.stringify({ count }), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
				},
			})
		} else if (request.url.endsWith('/alarm')) {
			const currentAlarm = await this.storage.getAlarm()
			if (currentAlarm == null) {
				this.storage.setAlarm(Date.now() + 1000)
			}

			return new Response('Hello, world!', {
				headers: {
					'Content-Type': 'text/plain',
					'Access-Control-Allow-Origin': '*',
				},
			})
		}

		return new Response('Not found', { status: 404 })
	}

	async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
		console.log('Received message:', message)
		if (message === 'inc') {
			const count: number = (await this.storage.get('count')) || 0
			console.log('Incrementing count to', count + 1)
			this.storage.put('count', count + 1)
		} else if (message === 'dec') {
			const count: number = (await this.storage.get('count')) || 0
			this.storage.put('count', count - 1)
		}

		const count: number = (await this.storage.get('count')) || 0
		await this.broadcast(JSON.stringify({ count }))
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		// If the client closes the connection, the runtime will invoke the webSocketClose() handler.
		ws.close(code, 'Durable Object is closing WebSocket')

		console.log('WebSocket closed:', ws, code, reason, wasClean)

		const clientsCount = this.state.getWebSockets().length
		console.log('Clients count:', clientsCount)
		if (clientsCount <= 1) {
			this.storage.deleteAll()
		}
	}

	async alarm() {
		const count: number = (await this.storage.get('count')) || 0
		console.log('Alarm, inc', count + 1)
		this.storage.put('count', count + 1)
		await this.broadcast(JSON.stringify({ count: count + 1 }))
		this.storage.setAlarm(Date.now() + 1000)
	}

	private async broadcast(message: string) {
		this.state.getWebSockets().forEach((ws) => ws.send(message))
	}
}
