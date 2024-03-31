import { TELEGRAM_BOT_TOKEN } from '$env/static/private'

export namespace TelegramClient {
	export const sendMessage = async (chatId: number, text: string) => {
		await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				chat_id: chatId,
				text,
			}),
		})
	}
}
