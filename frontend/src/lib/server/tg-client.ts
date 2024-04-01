import { TELEGRAM_BOT_TOKEN } from '$env/static/private'
import type { InlineKeyboardMarkup, InlineQueryResult, WebAppInfo } from '@grammyjs/types'

export namespace TelegramClient {
	export const sendMessage = async (
		chatId: number,
		text: string,
		replyMarkup?: InlineKeyboardMarkup
	) => {
		return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				chat_id: chatId,
				text,
				reply_markup: replyMarkup,
			}),
		})
	}

	export const answerWebAppQuery = async (queryId: string, result: InlineQueryResult) => {
		return fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerWebAppQuery`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				web_app_query_id: queryId,
				result: JSON.stringify(result),
			}),
		})
	}
}
