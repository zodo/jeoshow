import { TelegramClient } from '$lib/server/tg-client'

export const GET = async ({ params }) => {
	const { id } = params

	const userId = parseInt(id)

	const photos = await TelegramClient.getUserProfilePhotos(userId)
	const photoId = photos.photos[0][0].file_id
	const url = await TelegramClient.getFileUrl(photoId)
	const photo = await fetch(url)
	const photoBlob = await photo.blob()

	return new Response(photoBlob, {
		headers: {
			'Content-Type': photoBlob.type,
			'Cache-Control': 'public, max-age=86400',
		},
	})
}
