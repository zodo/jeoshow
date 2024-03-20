export function load({ cookies, params }) {
	const userId = cookies.get('user_id')
	if (!userId) {
		cookies.set('user_id', Math.random().toString(36).slice(2), {
			path: '/',
			sameSite: 'lax',
		})
	}

	const gameCode = params.code

	return {
		gameCode,
		userId,
	}
}
