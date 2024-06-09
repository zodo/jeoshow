import { TelegramClient } from '$lib/server/tg-client.js'

export const POST = async ({ request }) => {
	const body = (await request.json()) as {
		queryId: string
		gameCode: string
		packName: string
	}

	console.log('receceived', body)

	const webappUrl = `https://t.me/jeoshow_bot/game?startapp=${body.gameCode}`

	const response = await TelegramClient.answerWebAppQuery(body.queryId, {
		type: 'article',
		id: crypto.randomUUID(),
		title: 'Game created!',
		url: webappUrl,
		input_message_content: {
			parse_mode: 'Markdown',
			message_text: `Игра с паком ${body.packName} готова! [JOIN](${webappUrl}). Пересылай это сообщение другим игрокам, чтобы играть вместе`,
		},
	})

	console.log('response', await response.text())

	return new Response('OK', { status: 200 })
}
