import { GameState } from './GameState'
export { GameState }

export default {
	async fetch(request: Request, env: CfEnv, ctx: ExecutionContext): Promise<Response> {
		const id = env.JEOSHOW_GAME_STATE.idFromName('game-state')
		const stub = env.JEOSHOW_GAME_STATE.get(id)

		return stub.fetch(request)
	},
}
