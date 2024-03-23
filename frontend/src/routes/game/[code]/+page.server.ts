export function load({ cookies, params }) {
	const userId = cookies.get('user_id')
	const gameCode = params.code
	if (userId) {
		return {
			gameCode,
			userId,
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
