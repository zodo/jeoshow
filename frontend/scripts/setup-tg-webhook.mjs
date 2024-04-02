import nodeFetch from 'node-fetch'
import dotenv from 'dotenv'
import { argv } from 'process'
import { existsSync } from 'fs'

const env = argv[2] || ''
const envFilePath = existsSync(`.env.${env}`) ? `.env.${env}` : '.env'
console.log(`Using env file: ${envFilePath}`)
dotenv.config({ path: envFilePath })

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
				drop_pending_updates: true,
			}),
		})
		const data = await response.text()
		console.log(data)
	} catch (error) {
		console.error(error)
	}
}

execute()
