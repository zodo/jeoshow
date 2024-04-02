import type { RequestEvent } from '@sveltejs/kit'

export const GET = async ({ params, platform, request }: RequestEvent) => {
	const packId = params.packId
	const filename = params.file

	const bucket: R2Bucket | undefined = platform?.env.JEOSHOW_PACKS
	if (!bucket) {
		return new Response(JSON.stringify({ error: 'No bucket found' }), { status: 500 })
	}

	let range: { offset: number; length: number } | undefined
	const rangeHeader = request.headers.get('Range')
	if (rangeHeader) {
		const match = rangeHeader.match(/^bytes=(\d+)-(\d+)$/)
		if (match) {
			const [start, end] = match.map((n) => parseInt(n))
			range = {
				offset: start,
				length: end - start + 1,
			}
		}
	}

	const contentObject = await bucket.get(`packs/${packId}/${filename}`, { range })
	if (!contentObject) {
		return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 })
	}

	const content = await contentObject.blob()

	contentObject.size

	return new Response(content, {
		headers: {
			'Content-Type': content.type,
			...(range
				? {
						'Content-Range': `bytes ${range.offset}-${range.offset + range.length - 1}/${contentObject.size}`,
						'Content-Length': `${range.length + 1}`,
					}
				: {}),
		},
		status: range ? 206 : 200,
	})
}
