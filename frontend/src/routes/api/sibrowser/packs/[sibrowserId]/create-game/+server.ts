import { json } from '@sveltejs/kit'
import JSZip from 'jszip'
import { PUBLIC_ENGINE_URL } from '$env/static/public'

const SIBROWSER_BASE = 'https://www.sibrowser.ru'
const MAX_PACK_SIZE = 100 * 1024 * 1024 // 100MB
const MAPPING_PREFIX = 'sibrowser-cache/id-map/'

export async function POST({ params, platform }) {
	if (!platform) {
		return json({ error: 'No platform found' }, { status: 500 })
	}

	const bucket = platform.env.JEOSHOW_PACKS
	const sibrowserId = params.sibrowserId

	// 0. Check if we already know the hash for this sibrowser pack
	const cachedMapping = await bucket.get(`${MAPPING_PREFIX}${sibrowserId}`)
	if (cachedMapping) {
		const hash = await cachedMapping.text()
		// Pack already in R2, just create the game
		const engineResponse = await fetch(`${PUBLIC_ENGINE_URL}/create-game`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ packId: hash }),
		})
		if (engineResponse.ok) {
			return json(await engineResponse.json())
		}
		// If engine fails, fall through to re-download
	}

	// 1. Download .siq from sibrowser (follows 302 redirect to VK)
	const downloadUrl = `${SIBROWSER_BASE}/packages/${sibrowserId}/direct_download`
	let downloadResponse: Response
	try {
		downloadResponse = await fetch(downloadUrl, {
			headers: { 'User-Agent': 'Jeoshow/1.0' },
			redirect: 'follow',
		})
	} catch {
		return json({ error: 'Failed to download pack' }, { status: 502 })
	}

	if (!downloadResponse.ok) {
		return json({ error: `Download failed: ${downloadResponse.status}` }, { status: 502 })
	}

	// Validate response is not HTML (VK might serve a page)
	const contentType = downloadResponse.headers.get('content-type') ?? ''
	if (contentType.includes('text/html')) {
		return json({ error: 'Download returned HTML instead of file' }, { status: 502 })
	}

	// Check size
	const contentLength = downloadResponse.headers.get('content-length')
	if (contentLength && parseInt(contentLength, 10) > MAX_PACK_SIZE) {
		return json({ error: 'Pack is too large (max 100MB)' }, { status: 413 })
	}

	const packBuffer = await downloadResponse.arrayBuffer()

	// 2. Calculate SHA-1 hash (same as client-side pack-uploader.ts)
	const digest = await crypto.subtle.digest('SHA-1', packBuffer)
	const hash = Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')

	const prefix = `packs/${hash}`

	// 3. Check if already uploaded (dedup)
	const existing = await bucket.get(`${prefix}/content.xml`)
	if (!existing) {
		// 4. Extract ZIP and upload to R2
		let zip: JSZip
		try {
			zip = await JSZip.loadAsync(packBuffer)
		} catch {
			return json({ error: 'Invalid pack: not a valid ZIP file' }, { status: 400 })
		}

		if (!zip.files['content.xml']) {
			return json({ error: 'Invalid pack: no content.xml found' }, { status: 400 })
		}

		const mapping: Record<string, string> = {}

		// Upload media files with randomized names
		for (const [originalName, file] of Object.entries(zip.files)) {
			if (file.dir) continue
			if (originalName === 'content.xml') continue

			const content = await file.async('arraybuffer')
			const extension = originalName.split('.').pop()
			const randomId = Math.random().toString(36).substring(7)
			const newName = `${randomId}.${extension}`
			await bucket.put(`${prefix}/${newName}`, content)
			mapping[originalName] = newName
		}

		// Upload content.xml and mapping.json
		const contentXml = await zip.files['content.xml'].async('arraybuffer')
		await bucket.put(`${prefix}/content.xml`, contentXml)
		await bucket.put(`${prefix}/mapping.json`, JSON.stringify(mapping))
	}

	// 5. Save sibrowserId → hash mapping for future lookups
	await bucket.put(`${MAPPING_PREFIX}${sibrowserId}`, hash)

	// 6. Call engine to create game
	const engineResponse = await fetch(`${PUBLIC_ENGINE_URL}/create-game`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ packId: hash }),
	})

	if (!engineResponse.ok) {
		return json({ error: 'Failed to create game' }, { status: 502 })
	}

	const engineData = (await engineResponse.json()) as { gameCode: string; packName: string }
	return json(engineData)
}
