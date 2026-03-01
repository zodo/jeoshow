import JSZip from 'jszip'

const SIBROWSER_BASE = 'https://www.sibrowser.ru'
const MAX_PACK_SIZE = 100 * 1024 * 1024
const MAPPING_PREFIX = 'sibrowser-cache/id-map/'
const REGISTRY_KEY = 'sibrowser-cache/downloaded-registry.json'

export interface PackMetadataInput {
	title: string
	author: string
	fileSize: string
	tags: string[]
	description: string
	rounds: { name: string; themes: string }[]
}

type SSEWriter = {
	progress: (msg: string) => void
	done: (data: Record<string, unknown>) => void
	error: (msg: string) => void
}

function createSSEStream(corsHeaders: Record<string, string>): {
	response: Response
	writer: SSEWriter
} {
	const encoder = new TextEncoder()
	const { readable, writable } = new TransformStream()
	const w = writable.getWriter()

	const send = (event: string, data: string) => {
		w.write(encoder.encode(`event: ${event}\ndata: ${data}\n\n`))
	}

	return {
		response: new Response(readable, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				Connection: 'keep-alive',
				...corsHeaders,
			},
		}),
		writer: {
			progress: (msg) => send('progress', msg),
			done: (data) => {
				send('done', JSON.stringify(data))
				w.close()
			},
			error: (msg) => {
				send('error', msg)
				w.close()
			},
		},
	}
}

export async function processSibrowserPack(
	sibrowserId: string,
	env: CfEnv,
	createGame: (packId: string) => Promise<{ gameCode: string; packName: string }>,
	corsHeaders: Record<string, string>,
	packMetadata?: PackMetadataInput
): Promise<Response> {
	const bucket = env.JEOSHOW_PACKS

	// Fast path: cached mapping
	const cachedMapping = await bucket.get(`${MAPPING_PREFIX}${sibrowserId}`)
	if (cachedMapping) {
		const hash = await cachedMapping.text()
		// Lazy backfill: add to registry if not yet there
		if (packMetadata) {
			updateDownloadedRegistry(bucket, sibrowserId, hash, packMetadata)
		}
		try {
			const result = await createGame(hash)
			return new Response(JSON.stringify(result), {
				headers: { 'Content-Type': 'application/json', ...corsHeaders },
			})
		} catch {
			// Fall through to slow path
		}
	}

	// Slow path: download, extract, upload — stream progress
	const { response, writer } = createSSEStream(corsHeaders)

	const run = async () => {
		try {
			writer.progress('Скачивание пака...')

			const downloadUrl = `${SIBROWSER_BASE}/packages/${sibrowserId}/direct_download`
			let downloadResponse: Response
			try {
				downloadResponse = await fetch(downloadUrl, {
					headers: { 'User-Agent': 'Jeoshow/1.0' },
					redirect: 'follow',
				})
			} catch {
				writer.error('Не удалось скачать пак')
				return
			}

			if (!downloadResponse.ok) {
				writer.error(`Ошибка скачивания: ${downloadResponse.status}`)
				return
			}

			const contentType = downloadResponse.headers.get('content-type') ?? ''
			if (contentType.includes('text/html')) {
				writer.error('Сервер вернул HTML вместо файла')
				return
			}

			const contentLength = downloadResponse.headers.get('content-length')
			if (contentLength && parseInt(contentLength, 10) > MAX_PACK_SIZE) {
				writer.error('Пак слишком большой (макс. 100МБ)')
				return
			}

			const packBuffer = await downloadResponse.arrayBuffer()

			writer.progress('Обработка архива...')

			const digest = await crypto.subtle.digest('SHA-1', packBuffer)
			const hash = Array.from(new Uint8Array(digest))
				.map((b) => b.toString(16).padStart(2, '0'))
				.join('')

			const prefix = `packs/${hash}`

			const existing = await bucket.get(`${prefix}/content.xml`)
			if (!existing) {
				let zip: JSZip
				try {
					zip = await JSZip.loadAsync(packBuffer)
				} catch {
					writer.error('Невалидный пак: не ZIP-архив')
					return
				}

				if (!zip.files['content.xml']) {
					writer.error('Невалидный пак: нет content.xml')
					return
				}

				const mapping: Record<string, string> = {}
				const files = Object.entries(zip.files).filter(
					([name, f]) => !f.dir && name !== 'content.xml'
				)
				let uploaded = 0

				writer.progress(`Загрузка файлов: 0/${files.length}`)

				for (const [originalName, file] of files) {
					const content = await file.async('arraybuffer')
					const extension = originalName.split('.').pop()
					const randomId = Math.random().toString(36).substring(7)
					const newName = `${randomId}.${extension}`
					await bucket.put(`${prefix}/${newName}`, content)
					mapping[originalName] = newName
					uploaded++
					writer.progress(`Загрузка файлов: ${uploaded}/${files.length}`)
				}

				const contentXml = await zip.files['content.xml'].async('arraybuffer')
				await bucket.put(`${prefix}/content.xml`, contentXml)
				await bucket.put(`${prefix}/mapping.json`, JSON.stringify(mapping))
			}

			await bucket.put(`${MAPPING_PREFIX}${sibrowserId}`, hash)

			if (packMetadata) {
				await updateDownloadedRegistry(bucket, sibrowserId, hash, packMetadata)
			}

			writer.progress('Создание игры...')

			try {
				const result = await createGame(hash)
				writer.done(result)
			} catch {
				writer.error('Не удалось создать игру')
			}
		} catch (e) {
			console.error('process-sibrowser-pack error:', e)
			writer.error('Произошла непредвиденная ошибка')
		}
	}

	run()

	return response
}

interface DownloadedPack {
	sibrowserId: string
	packHash: string
	title: string
	author: string
	fileSize: string
	tags: string[]
	description: string
	rounds: { name: string; themes: string }[]
	downloadedAt: number
}

async function updateDownloadedRegistry(
	bucket: R2Bucket,
	sibrowserId: string,
	packHash: string,
	meta: PackMetadataInput
) {
	let packs: DownloadedPack[] = []
	try {
		const existing = await bucket.get(REGISTRY_KEY)
		if (existing) {
			const registry = (await existing.json()) as { packs: DownloadedPack[] }
			packs = registry.packs
		}
	} catch {
		// start fresh
	}

	const idx = packs.findIndex((p) => p.sibrowserId === sibrowserId)
	const entry: DownloadedPack = {
		sibrowserId,
		packHash,
		title: meta.title,
		author: meta.author,
		fileSize: meta.fileSize,
		tags: meta.tags,
		description: meta.description,
		rounds: meta.rounds,
		downloadedAt: Date.now(),
	}

	if (idx >= 0) {
		packs[idx] = entry
	} else {
		packs.push(entry)
	}

	await bucket.put(REGISTRY_KEY, JSON.stringify({ packs, updatedAt: Date.now() }))
}
