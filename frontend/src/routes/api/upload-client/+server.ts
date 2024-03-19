import type { RequestEvent } from './$types'

export const POST = async ({ request, platform }: RequestEvent) => {
	const data = await request.formData()

	const file = data.get('file') as File
	const hash = data.get('hash') as string
	const fileName = data.get('path') as string

	if (!file || typeof file === 'string') {
		return new Response(JSON.stringify({ error: 'No file uploaded' }))
	}

	if (!hash || typeof hash !== 'string') {
		return new Response(JSON.stringify({ error: 'No hash provided' }))
	}

	if (!fileName || typeof fileName !== 'string') {
		return new Response(JSON.stringify({ error: 'No file name provided' }))
	}

	const bucket: R2Bucket | undefined = platform?.env.JEOSHOW_PACKS
	if (!bucket) {
		return new Response(JSON.stringify({ error: 'No bucket found' }))
	}

	const prefix = `packs/${hash}/`

	if (
		fileName.startsWith('Audio') ||
		fileName.startsWith('Images') ||
		fileName.startsWith('Video')
	) {
		const extension = fileName.split('.').pop()
		const newName = `${Math.random().toString(36).substring(7)}.${extension}`
		const targetPath = `${prefix}${newName}`
		await bucket.put(targetPath, file)
		const mapping = await bucket.get(`${prefix}mapping.json`)
		if (mapping) {
			const jsonText = await mapping.text()
			const mappingData = JSON.parse(jsonText)
			mappingData[fileName] = targetPath
			await bucket.put(`${prefix}mapping.json`, JSON.stringify(mappingData))
		} else {
			await bucket.put(`${prefix}mapping.json`, JSON.stringify({ [fileName]: targetPath }))
		}
	} else {
		bucket.put(`${prefix}${fileName}`, file)
	}

	return new Response(JSON.stringify({ success: true }))
}
