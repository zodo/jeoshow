import { PUBLIC_ENGINE_URL } from '$env/static/public'
import { fail, redirect } from '@sveltejs/kit'
import JSZip from 'jszip'

export const actions = {
	default: async ({ request, platform }) => {
		if (!platform) {
			return fail(500, { message: 'No platform found' })
		}
		let gameId: string
		try {
			const formData = await request.formData()
			console.log('Uploading pack')
			const packId = await uploadPack(formData, platform)
			console.log(`Pack uploaded: ${packId}, creating game`)
			gameId = await createGame(packId)
			console.log(`Game created: ${gameId}`)
		} catch (e) {
			console.error(e)
			if (e instanceof Error) {
				return fail(500, { message: e.message })
			} else {
				return fail(500, { message: 'Unknown error' })
			}
		}
		redirect(302, `/game/${gameId}`)
	},
}

const uploadPack = async (data: FormData, platform: App.Platform): Promise<string> => {
	const pack = data.get('pack') as File

	if (!pack || typeof pack === 'string') {
		throw Error('No file uploaded')
	}

	const bucket: R2Bucket | undefined = platform?.env.JEOSHOW_PACKS
	if (!bucket) {
		throw Error('No bucket found')
	}

	const packArrayBuffer = await pack.arrayBuffer()
	const hash = await calculateHash(packArrayBuffer)
	const prefix = `packs/${hash}/`
	const existingContentXml = await bucket.get(`${prefix}content.xml`)
	if (existingContentXml) {
		return hash
	}

	const zip = await JSZip.loadAsync(packArrayBuffer)

	if (!zip.files['content.xml']) {
		throw Error('content.xml not found')
	}

	const mapping: Record<string, string> = {}
	for (const [fileName, file] of Object.entries(zip.files)) {
		const content = await file.async('blob')

		const lowercaseFilename = fileName.toLowerCase()
		if (
			lowercaseFilename.startsWith('audio') ||
			lowercaseFilename.startsWith('images') ||
			lowercaseFilename.startsWith('video')
		) {
			const extension = fileName.split('.').pop()
			const newName = `${Math.random().toString(36).substring(7)}.${extension}`
			const targetPath = `${prefix}${newName}`
			await bucket.put(targetPath, content)
			mapping[fileName] = targetPath
		} else {
			bucket.put(`${prefix}${fileName}`, content)
		}
	}
	await bucket.put(`${prefix}mapping.json`, JSON.stringify(mapping))

	return hash
}

const calculateHash = async (file: ArrayBuffer): Promise<string> => {
	const digest = await crypto.subtle.digest('SHA-1', file)
	const str = Array.from(new Uint8Array(digest))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('')
	return str
}

const createGame = async (packId: string): Promise<string> => {
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
	return data.gameCode
}
