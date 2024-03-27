import { json } from '@sveltejs/kit'

export async function POST({ request, params, platform }) {
	if (!platform) {
		return json({ message: 'No platform found' }, { status: 500 })
	}

	const bucket = platform.env.JEOSHOW_PACKS
	const packId = params.packId
	const prefix = `packs/${packId}`

	const formData = await request.formData()
	const file = formData.get('file') as File
	const originalFilename = formData.get('filename') as string
	if (['content.xml', 'mapping.json'].includes(originalFilename.toLowerCase())) {
		await bucket.put(`${prefix}/${originalFilename}`, file)
		return json({ filename: originalFilename })
	} else {
		const extension = originalFilename.split('.').pop()
		const randomId = Math.random().toString(36).substring(7)
		const newName = `${randomId}.${extension}`
		const targetPath = `${prefix}/${newName}`
		await bucket.put(targetPath, file)
		return json({ filename: newName })
	}
}
