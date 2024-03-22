import type { RequestEvent } from '@sveltejs/kit'

export const GET = async ({ params, platform }: RequestEvent) => {
	const packId = params.packId
	const filename = params.file

	const bucket: R2Bucket | undefined = platform?.env.JEOSHOW_PACKS
	if (!bucket) {
		return new Response(JSON.stringify({ error: 'No bucket found' }), { status: 500 })
	}
	const contentObject = await bucket.get(`packs/${packId}/${filename}`)
	if (!contentObject) {
		return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 })
	}

	const content = await contentObject.blob()

	return new Response(content, {
		headers: {
			'Content-Type': content.type,
		},
	})
}
