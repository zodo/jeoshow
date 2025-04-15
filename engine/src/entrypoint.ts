import GameDurableObjectSqlite from './durable-object'

export { GameDurableObjectSqlite }

export default {
	async fetch(request: Request, env: CfEnv, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url)
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: {
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': '*',
					'Access-Control-Allow-Headers': '*',
				},
			})
		} else if (url.pathname === '/create-game' && request.method === 'POST') {
			const gameCode = Math.random().toString(36).substring(2, 8)
			const gameId = env.JEOSHOW_GAME_STATE_SQLITE.idFromName(gameCode)
			const game = env.JEOSHOW_GAME_STATE_SQLITE.get(gameId)

			const createResponse = await game.fetch(request)
			const createJson = (await createResponse.json()) as any

			return new Response(JSON.stringify({ gameCode, ...createJson }), {
				headers: {
					'Content-Type': 'application/json',
					'Access-Control-Allow-Origin': '*',
					'Access-Control-Allow-Methods': '*',
					'Access-Control-Allow-Headers': '*',
				},
			})
		} else if (url.searchParams.has('gameCode')) {
			const gameId = env.JEOSHOW_GAME_STATE_SQLITE.idFromName(url.searchParams.get('gameCode')!!)
			const game = env.JEOSHOW_GAME_STATE_SQLITE.get(gameId)
			return game.fetch(request)
		}

		return new Response('Not found', { status: 404 })
	},
}
