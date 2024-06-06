import { TELEGRAM_BOT_API_SECRET_TOKEN } from '$env/static/private'
import { PUBLIC_FRONTEND_ROOT_URL, PUBLIC_POSTGHOG_API_KEY } from '$env/static/public'
import { TelegramClient } from '$lib/server/tg-client'
import type { Update } from '@grammyjs/types'
import { PostHog } from 'posthog-node'

export const POST = async ({ request, platform }) => {
	if (!isTelegramRequest(request.headers)) {
		return new Response('Unauthorized', { status: 401 })
	}

	const ph = new PostHog(PUBLIC_POSTGHOG_API_KEY, {
		host: 'https://eu.i.posthog.com',
		disableGeoip: true,
	})

	const update = (await request.json()) as Update

	const userId = update.message?.from?.id?.toString()

	try {
		if (update.message && update.message.text === '/start') {
			if (userId) {
				ph.identify({
					distinctId: userId,
					properties: {
						name: update.message.from.first_name,
					},
				})
				ph.capture({
					distinctId: userId,
					event: 'bot_started',
				})

				await ph.shutdown()
			}

			const response = await TelegramClient.sendMessage(
				update.message.chat.id,
				'Привет! Загружай siq пак. Скачивай паки с https://sigame.xyz/',
				{
					inline_keyboard: [
						[
							{
								text: 'Загрузить',
								web_app: {
									url: `${PUBLIC_FRONTEND_ROOT_URL}/telegram`,
								},
							},
						],
					],
				},
				{ is_disabled: true }
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
