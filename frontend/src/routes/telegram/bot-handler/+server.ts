import { TELEGRAM_BOT_API_SECRET_TOKEN } from '$env/static/private'
import { PUBLIC_FRONTEND_ROOT_URL } from '$env/static/public'
import { TelegramClient } from '$lib/server/tg-client'
import type { Update } from '@grammyjs/types'

export const POST = async ({ request }) => {
	if (!isTelegramRequest(request.headers)) {
		return new Response('Unauthorized', { status: 401 })
	}

	const update = (await request.json()) as Update

	try {
		if (update.message && update.message.text === '/start') {
			const response = await TelegramClient.sendMessage(
				update.message.chat.id,
				'Hello! Upload siq pack. Download packs from https://sigame.xyz/',
				{
					inline_keyboard: [
						[
							{
								text: 'Upload pack',
								web_app: {
									url: `${PUBLIC_FRONTEND_ROOT_URL}/telegram`,
								},
							},
						],
					],
				}
			)

			console.log('response', await response.text())
		}
	} catch (e) {
		console.error(e)
		// await TelegramClient.sendMessage(message.chat.id, 'Error occurred. Please try again later.')
	}

	return new Response('OK', { status: 200 })
}

const isTelegramRequest = (headers: Headers): boolean => {
	const requestToken = headers.get('X-Telegram-Bot-Api-Secret-Token')
	return requestToken === TELEGRAM_BOT_API_SECRET_TOKEN
}
