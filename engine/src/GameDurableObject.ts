import type { ClientAction } from 'shared/models/commands'
import type { GameState } from './game/state/models'
import type {
	ClientCommand,
	GameCommand,
	ScheduledCommand,
	ServerCommandOfType,
	UpdateEvent,
	UpdateResult,
} from './game/state/state-machine-models'
import { updateState } from './game/state/state-machine'
import { initGame } from './game/create'
import type { GameEvents } from 'shared/models/events'
import { a } from 'vitest/dist/suite-a18diDsI'

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
		const command: ClientCommand<ClientAction> = {
			type: 'client',
			playerId: this.state.getTags(ws)[0],
			action: JSON.parse(message as string),
		}
		console.log('<- ws:', command.type, command.action.type)
		await this.modifyState(command, Date.now(), 'ws', ws)
	}

	async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
		ws.close(code, 'Durable Object is closing WebSocket')
		const userId = this.state.getTags(ws)[0]
		const command: ServerCommandOfType<'player-disconnect'> = {
			type: 'server',
			action: { type: 'player-disconnect', playerId: userId },
		}
		console.log('<- ws close:', command.type, command.action.type)
		await this.modifyState(command, Date.now(), 'ws', ws)
	}

	async alarm() {
		const now = Date.now()
		const scheduledCommands = (await this.storage.get('scheduledCommands')) as string
		const commands: ScheduledCommand[] = scheduledCommands ? JSON.parse(scheduledCommands) : []
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

	private async modifyState(
		command: GameCommand,
		now: number,
		origin: 'ws' | 'alarm',
		ws?: WebSocket
	) {
		const currentStateJson = (await this.storage.get('state')) as string
		const currentState = JSON.parse(currentStateJson) as GameState

		const { state, events } = this.recursivelyUpdateState(currentState, command)

		if (state && state !== currentState) {
			this.storage.put('state', JSON.stringify(state))
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
				(e): e is Extract<UpdateEvent, { type: 'schedule' }> => e.type === 'schedule'
			) ?? []
		for (const event of scheduledCommands) {
			console.log('-> schedule:', event.command.type, event.command.action.type)
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
		depth = 0
	): UpdateResult {
		if (depth > 10) {
			throw new Error(`Likely infinite loop: ${depth}, command: ${JSON.stringify(command)}`)
		}

		const { state: updatedState, events } = updateState(state, command)

		const triggerEvents =
			events?.filter(
				(e): e is Extract<UpdateEvent, { type: 'trigger' }> => e.type === 'trigger'
			) ?? []

		const nonTriggerEvents = events?.filter((e) => e.type !== 'trigger') ?? []

		const finalState = triggerEvents.reduce<GameState>((currentState, event) => {
			console.log('-> trigger:', event.command.type, event.command.action.type)
			const result = this.recursivelyUpdateState(currentState, event.command, depth + 1)
			nonTriggerEvents.push(...(result.events ?? []))
			return result.state ?? currentState
		}, updatedState ?? state)

		return { state: finalState, events: nonTriggerEvents }
	}

	private async modifyScheduledCommands(
		now: number,
		modifier: (commands: ScheduledCommand[]) => ScheduledCommand[]
	) {
		const scheduledCommandsJson =
			((await this.storage.get('scheduledCommands')) as string) || '[]'
		let commands: ScheduledCommand[] = JSON.parse(scheduledCommandsJson)
		commands = modifier(commands)
		const closestTime = Math.min(...commands.map((c) => c.time).filter((t) => t > now))
		if (closestTime !== Infinity) {
			await this.storage.setAlarm(closestTime)
		}
		await this.storage.put('scheduledCommands', JSON.stringify(commands))
	}
}
