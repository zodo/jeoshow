import { TelegramClient } from '$lib/server/tg-client.js'

export const POST = async ({ request }) => {
	const body = (await request.json()) as {
		queryId: string
		gameId: string
	}

	console.log('receceived', body)

	const response = await TelegramClient.answerWebAppQuery(body.queryId, {
		type: 'article',
		id: crypto.randomUUID(),
		title: 'Game created!',
		input_message_content: {
			parse_mode: 'MarkdownV2',
			message_text: `Game created for sure\\! Here is your [game link](https://t.me/jeoshow_bot/game?startapp=${body.gameId})`,
		},
	})

	console.log('response', await response.text())

	return new Response('OK', { status: 200 })
}
