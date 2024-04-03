import { PUBLIC_ENGINE_URL } from '$env/static/public'

export async function load({ url }) {
	const gameCode = url.searchParams.get('tgWebAppStartParam')
	if (gameCode) {
		const gameExists = await isGameExists(gameCode)
		return {
			gameExists,
		}
	} else {
		return {
			gameExists: false,
		}
	}
}

const isGameExists = async (gameCode: string): Promise<boolean> => {
	try {
		const res = await fetch(`${PUBLIC_ENGINE_URL}/get-game-info?gameCode=${gameCode}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: '{}',
		})
		const data = (await res.json()) as any
		return data.gameExists
	} catch (e) {
		return false
	}
}
