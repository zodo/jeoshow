import { PUBLIC_ENGINE_URL } from '$env/static/public'
import JSZip from 'jszip'
import posthog from 'posthog-js'

export const uploadPack = async (
	file: File,
	reportProgress?: (percent: number) => void
): Promise<string> => {
	reportProgress?.(0)
	const packArrayBuffer = await file.arrayBuffer()
	const hash = await calculateHash(packArrayBuffer)
	console.log(`Calculated pack hash: ${hash}`)
	const existingPackResponse = await fetch(`/api/packs/${hash}`)
	const existingPack = (await existingPackResponse.json()) as any
	if (existingPack.packUploaded) {
		console.log('Pack already uploaded')
		return hash
	}

	const zip = await JSZip.loadAsync(packArrayBuffer)
	console.log('Loaded zip file')

	if (!zip.files['content.xml']) {
		throw Error('content.xml not found')
	}

	const totalFiles = Object.keys(zip.files).length + 1
	const mapping: Record<string, string> = {}

	const uploadChunk = async (chunk: [string, JSZip.JSZipObject][]) => {
		const promises = chunk.map(async ([originalName, file]) => {
			if (originalName === 'content.xml') {
				return null // Skip uploading this file
			}
			const content = await file.async('blob')
			const newFilename = await uploadFile(hash, content, originalName)
			mapping[originalName] = newFilename
			reportProgress?.((Object.keys(mapping).length / totalFiles) * 100)
			return newFilename
		})
		await Promise.all(promises)
	}

	const entries = Object.entries(zip.files)
	const chunkSize = Math.ceil(entries.length / 8)

	for (let i = 0; i < entries.length; i += chunkSize) {
		await uploadChunk(entries.slice(i, i + chunkSize))
	}

	await uploadFile(hash, await zip.files['content.xml'].async('blob'), 'content.xml')
	await uploadFile(hash, JSON.stringify(mapping), 'mapping.json')

	return hash
}

export const createGame = async (
	packId: string
): Promise<{
	gameCode: string
	packName: string
}> => {
	const res = await fetch(`${PUBLIC_ENGINE_URL}/create-game`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			packId: packId,
		}),
	})
	const data = (await res.json()) as any

	posthog.capture('game_created', {
		pack_id: packId,
		pack_name: data.packName,
		game_code: data.gameCode,
	})

	return data
}

const calculateHash = async (file: ArrayBuffer): Promise<string> => {
	const digest = await crypto.subtle.digest('SHA-1', file)
	const str = Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
	return str
}

const uploadFile = async (
	packId: string,
	file: Blob | string,
	originalName: string
): Promise<string> => {
	const formData = new FormData()
	formData.append('file', file)
	formData.append('filename', originalName)
	const response = await fetch(`/api/packs/${packId}/upload`, {
		method: 'POST',
		body: formData,
	})
	const { filename } = (await response.json()) as { filename: string }
	return filename
}
