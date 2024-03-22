import { PUBLIC_ENGINE_URL } from '$env/static/public'
import { WebSocket } from 'partysocket'
import type { ClientAction } from 'shared/models/commands'
import type { GameEvents } from 'shared/models/events'
import { wsConnectionStatusStore } from './store'

export class WebSocketGameClient {
	ws: WebSocket
	pingInterval: NodeJS.Timeout

	constructor(gameCode: string, userId: string) {
		this.ws = new WebSocket(
			`ws://${PUBLIC_ENGINE_URL}/ws?gameCode=${gameCode}&userId=${userId}`
		)
		this.ws.onclose = () => {
			wsConnectionStatusStore.set('disconnected')
			console.log('Connection closed')
		}

		this.pingInterval = setInterval(() => {
			if (this.ws.readyState === this.ws.OPEN) {
				this.ws.send('ping')
			}
		}, 5000)
	}

	onConnect(callback: () => void) {
		this.ws.onopen = () => {
			wsConnectionStatusStore.set('connected')
			callback()
		}
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
		wsConnectionStatusStore.set('connected')
	}
}
