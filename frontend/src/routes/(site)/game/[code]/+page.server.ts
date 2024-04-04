import { PUBLIC_ENGINE_URL } from '$env/static/public'

export async function load({ cookies, params, url }) {
	const cookieUserId = cookies.get('user_id')
	const queryUserId = url.searchParams.get('user_id')
	const queryPlayerName = url.searchParams.get('player_name')
	const queryAvatarUrl = url.searchParams.get('avatar_url')
	const gameCode = params.code
	const { gameExists, playerName } = await getGameInfo(gameCode, queryUserId ?? cookieUserId)

	if (queryUserId && queryPlayerName && queryAvatarUrl) {
		// redirected from tg mini app
		cookies.set('user_id', queryUserId, {
			path: '/',
			sameSite: 'lax',
		})

		return {
			gameCode,
			userId: queryUserId,
			playerName: queryPlayerName,
			avatarUrl: queryAvatarUrl,
			gameExists,
		}
	}

	let userId = cookies.get('user_id')
	if (!userId) {
		userId = Math.random().toString(36).slice(2)
		cookies.set('user_id', userId, {
			path: '/',
			sameSite: 'lax',
		})
	}

	return {
		gameCode,
		userId,
		playerName,
		gameExists,
	}
}

const getGameInfo = async (
	gameCode: string,
	userId?: string | null
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
