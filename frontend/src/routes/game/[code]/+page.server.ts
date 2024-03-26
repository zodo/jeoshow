import { PUBLIC_ENGINE_URL } from '$env/static/public'
import { error } from '@sveltejs/kit'

export async function load({ cookies, params }) {
	const userId = cookies.get('user_id')
	const gameCode = params.code
	if (userId) {
		const { gameExists, playerName } = await getGameInfo(gameCode, userId)

		if (!gameExists) {
			return {
				errorMessage: 'Game not found',
			}
		}

		return {
			gameCode,
			userId,
			playerName,
		}
	} else {
		const userId = Math.random().toString(36).slice(2)
		cookies.set('user_id', userId, {
			path: '/',
			sameSite: 'lax',
		})

		return {
			gameCode,
			userId,
		}
	}
}

const getGameInfo = async (
	gameCode: string,
	userId: string
): Promise<{
	gameExists: boolean
	playerName?: string
}> => {
	try {
		const res = await fetch(`${PUBLIC_ENGINE_URL}/get-game-info?gameCode=${gameCode}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				userId,
			}),
		})
		const data = (await res.json()) as any
		console.log('data', data)
		return data
	} catch (e) {
		return {
			gameExists: false,
		}
	}
}
