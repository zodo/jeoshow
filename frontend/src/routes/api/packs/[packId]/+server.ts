import { json } from '@sveltejs/kit'

export async function GET({ request, params, platform }) {
	if (!platform) {
		return json({ message: 'No platform found' }, { status: 500 })
	}

	const bucket = platform.env.JEOSHOW_PACKS
	const packId = params.packId
	const prefix = `packs/${packId}`
	const existingContentXml = await bucket.get(`${prefix}/content.xml`)
	return json({ packUploaded: !!existingContentXml })
}
