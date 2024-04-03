import { TELEGRAM_BOT_TOKEN } from '$env/static/private'
import type {
	InlineKeyboardMarkup,
	InlineQueryResult,
	LinkPreviewOptions,
	UserProfilePhotos,
} from '@grammyjs/types'

export namespace TelegramClient {
	export const sendMessage = async (
		chatId: number,
		text: string,
		replyMarkup?: InlineKeyboardMarkup,
		linkPreviewOptions?: LinkPreviewOptions
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
				link_preview_options: linkPreviewOptions,
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

	export const getUserProfilePhotos = async (userId: number): Promise<UserProfilePhotos> => {
		const response = await fetch(
			`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUserProfilePhotos`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					user_id: userId,
					limit: 1,
				}),
			}
		)

		return ((await response.json()) as any).result
	}

	export const getFileUrl = async (fileId: string): Promise<string> => {
		const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				file_id: fileId,
			}),
		})

		const file = ((await response.json()) as any).result
		return `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${file.file_path}`
	}
}
