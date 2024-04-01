import 'dotenv/config'
import nodeFetch from 'node-fetch'

const { TELEGRAM_BOT_TOKEN, TELEGRAM_BOT_API_SECRET_TOKEN, TELEGRAM_WEBHOOK_URL } = process.env

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_BOT_API_SECRET_TOKEN || !TELEGRAM_WEBHOOK_URL) {
	throw new Error('Missing environment variables')
}

const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook`

const execute = async () => {
	try {
		await nodeFetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				url: '',
			}),
		})
		const response = await nodeFetch(url, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				url: TELEGRAM_WEBHOOK_URL,
				allowed_updates: ['message'],
				secret_token: TELEGRAM_BOT_API_SECRET_TOKEN,
			}),
		})
		const data = await response.text()
		console.log(data)
	} catch (error) {
		console.error(error)
	}
}

execute()
