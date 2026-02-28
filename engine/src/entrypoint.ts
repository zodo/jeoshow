import GameDurableObjectSqlite from './durable-object'
import { processSibrowserPack } from './sibrowser-pack'

export { GameDurableObjectSqlite }

const CORS_HEADERS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': '*',
	'Access-Control-Allow-Headers': '*',
}

export default {
	async fetch(request: Request, env: CfEnv, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		if (request.method === 'OPTIONS') {
			return new Response(null, { headers: CORS_HEADERS })
		} else if (url.pathname === '/create-game' && request.method === 'POST') {
			const result = await createGameFromPack(env, request)
			return new Response(JSON.stringify(result), {
				headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
			})
		} else if (url.pathname === '/process-sibrowser-pack' && request.method === 'POST') {
			const body = (await request.json()) as { sibrowserId: string }
			return processSibrowserPack(
				body.sibrowserId,
				env,
				(packId) => createGameFromPack(env, packId),
				CORS_HEADERS
			)
		} else if (url.searchParams.has('gameCode')) {
			const gameId = env.JEOSHOW_GAME_STATE_SQLITE.idFromName(
				url.searchParams.get('gameCode')!!
			)
			const game = env.JEOSHOW_GAME_STATE_SQLITE.get(gameId)
			return game.fetch(request)
		}

		return new Response('Not found', { status: 404 })
	},
}

async function createGameFromPack(
	env: CfEnv,
	requestOrPackId: Request | string
): Promise<{ gameCode: string; packName: string }> {
	const gameCode = Math.random().toString(36).substring(2, 8)
	const gameId = env.JEOSHOW_GAME_STATE_SQLITE.idFromName(gameCode)
	const game = env.JEOSHOW_GAME_STATE_SQLITE.get(gameId)

	const doRequest =
		typeof requestOrPackId === 'string'
			? new Request('https://dummy/create-game', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ packId: requestOrPackId }),
				})
			: requestOrPackId

	const createResponse = await game.fetch(doRequest)
	const createJson = (await createResponse.json()) as { packName: string }
	return { gameCode, ...createJson }
}
