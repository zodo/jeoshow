import { PUBLIC_ENGINE_URL } from '$env/static/public'
import { WebSocket } from 'partysocket'
import type { ClientAction } from 'shared/models/commands'
import type { GameEvents } from 'shared/models/events'
import { writable, type Readable, type Writable } from 'svelte/store'

export class WebSocketGameClient {
	ws: WebSocket
	pingInterval: NodeJS.Timeout
	isConnectedStore: Writable<boolean>

	constructor(gameCode: string, userId: string) {
		this.ws = new WebSocket(
			`ws://${PUBLIC_ENGINE_URL}/ws?gameCode=${gameCode}&userId=${userId}`
		)
		this.ws.onclose = () => {
			this.isConnectedStore.set(false)
			console.log('Connection closed')
		}

		this.pingInterval = setInterval(() => {
			if (this.ws.readyState === this.ws.OPEN) {
				this.ws.send('ping')
			}
		}, 5000)

		this.isConnectedStore = writable(false)
	}

	onConnect(callback: () => void) {
		this.ws.onopen = () => {
			this.isConnectedStore.set(true)
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
		this.isConnectedStore.set(false)
	}

	isConnected(): Readable<boolean> {
		return this.isConnectedStore
	}
}
