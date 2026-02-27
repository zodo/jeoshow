import type { RequestEvent } from '@sveltejs/kit'

const MIME_TYPES: Record<string, string> = {
	mp4: 'video/mp4',
	webm: 'video/webm',
	mp3: 'audio/mpeg',
	ogg: 'audio/ogg',
	wav: 'audio/wav',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	png: 'image/png',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	xml: 'application/xml',
	json: 'application/json',
}

function getMimeType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase() ?? ''
	return MIME_TYPES[ext] ?? 'application/octet-stream'
}

export const GET = async ({ params, platform, request }: RequestEvent) => {
	const packId = params.packId
	const filename = params.file

	const bucket: R2Bucket | undefined = platform?.env.JEOSHOW_PACKS
	if (!bucket) {
		return new Response(JSON.stringify({ error: 'No bucket found' }), { status: 500 })
	}

	const rangeHeader = request.headers.get('Range')
	const rangeMatch = rangeHeader?.match(/^bytes=(\d+)-(\d*)$/)

	// First get the object without range to know the size, or with range if fully specified
	let range: R2Range | undefined
	if (rangeMatch) {
		const start = parseInt(rangeMatch[1])
		const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : undefined
		range = end !== undefined ? { offset: start, length: end - start + 1 } : { offset: start }
	}

	const contentObject = await bucket.get(`packs/${packId}/${filename}`, { range })
	if (!contentObject) {
		return new Response(JSON.stringify({ error: 'File not found' }), { status: 404 })
	}

	const content = await contentObject.blob()
	const totalSize = contentObject.size
	const contentType = content.type || getMimeType(filename!)

	if (rangeMatch) {
		const start = parseInt(rangeMatch[1])
		const end = rangeMatch[2] ? parseInt(rangeMatch[2]) : totalSize - 1
		const length = end - start + 1
		return new Response(content, {
			status: 206,
			headers: {
				'Content-Type': contentType,
				'Content-Range': `bytes ${start}-${end}/${totalSize}`,
				'Content-Length': `${length}`,
				'Accept-Ranges': 'bytes',
			},
		})
	}

	return new Response(content, {
		headers: {
			'Content-Type': contentType,
			'Content-Length': `${totalSize}`,
			'Accept-Ranges': 'bytes',
		},
	})
}
