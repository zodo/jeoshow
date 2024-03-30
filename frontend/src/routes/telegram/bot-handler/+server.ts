import { TELEGRAM_BOT_API_SECRET_TOKEN, TELEGRAM_BOT_TOKEN } from '$env/static/private'
import type { Update } from '@grammyjs/types'

export const POST = async ({ request, params, platform }) => {
	if (!isTelegramRequest(request.headers)) {
		return new Response('Unauthorized', { status: 401 })
	}

	const update = (await request.json()) as Update
	const message = update.message!! // only message updates enabled

	if (message.text === '/start') {
		await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				chat_id: message.chat.id,
				text: "Hello, I'm working!",
			}),
		})
	}

	return new Response('OK', { status: 200 })
}

const isTelegramRequest = (headers: Headers): boolean => {
	const requestToken = headers.get('X-Telegram-Bot-Api-Secret-Token')
	return requestToken === TELEGRAM_BOT_API_SECRET_TOKEN
}
