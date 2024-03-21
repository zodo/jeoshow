import { PUBLIC_ENGINE_URL } from '$env/static/public'
import type { ClientAction } from 'shared/models/commands'
import type { GameEvents } from 'shared/models/events'

export class WebSocketGameClient {
	ws: WebSocket
	pingInterval: NodeJS.Timeout

	constructor(gameCode: string, userId: string) {
		this.ws = new WebSocket(
			`ws://${PUBLIC_ENGINE_URL}/ws?gameCode=${gameCode}&userId=${userId}`
		)
		this.ws.onclose = () => {
			console.log('Connection closed')
		}

		this.pingInterval = setInterval(() => {
			if (this.ws.readyState === this.ws.OPEN) {
				this.ws.send('ping')
			}
		}, 5000)
	}

	onConnect(callback: () => void) {
		this.ws.onopen = callback
	}

	onMessage(callback: (event: GameEvents.GameEvent) => void) {
		this.ws.onmessage = (event) => {
			if (event.data !== 'pong') {
				console.log('Received message:', event.data)
				const gameEvent = JSON.parse(event.data) as GameEvents.GameEvent
				callback(gameEvent)
			}
		}
	}

	sendMessage(message: ClientAction) {
		this.ws.send(JSON.stringify(message))
	}

	close() {
		clearInterval(this.pingInterval)
		this.ws.close()
	}
}
