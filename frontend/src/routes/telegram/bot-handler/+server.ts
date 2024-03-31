import { TELEGRAM_BOT_API_SECRET_TOKEN } from '$env/static/private'
import { TelegramClient } from '$lib/server/tg-client'
import type { Update } from '@grammyjs/types'

export const POST = async ({ request }) => {
	if (!isTelegramRequest(request.headers)) {
		return new Response('Unauthorized', { status: 401 })
	}

	const update = (await request.json()) as Update
	const message = update.message!! // only message updates enabled

	try {
		await TelegramClient.sendMessage(message.chat.id, 'Hello! Open the menu')
	} catch (e) {
		console.error(e)
		await TelegramClient.sendMessage(message.chat.id, 'Error occurred. Please try again later.')
	}

	return new Response('OK', { status: 200 })
}

const isTelegramRequest = (headers: Headers): boolean => {
	const requestToken = headers.get('X-Telegram-Bot-Api-Secret-Token')
	return requestToken === TELEGRAM_BOT_API_SECRET_TOKEN
}
