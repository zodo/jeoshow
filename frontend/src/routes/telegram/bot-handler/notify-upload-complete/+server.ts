import { TelegramClient } from '$lib/server/tg-client.js'

export const POST = async ({ request }) => {
	const body = (await request.json()) as {
		queryId: string
		gameId: string
	}

	console.log('receceived', body)

	const webappUrl = `https://t.me/jeoshow_bot/game?startapp=${body.gameId}`

	const response = await TelegramClient.answerWebAppQuery(body.queryId, {
		type: 'article',
		id: crypto.randomUUID(),
		title: 'Game created!',
		url: webappUrl,
		input_message_content: {
			parse_mode: 'MarkdownV2',
			message_text: `Game created for sure\\! Here is your [game link](${webappUrl})`,
		},
	})

	console.log('response', await response.text())

	return new Response('OK', { status: 200 })
}
