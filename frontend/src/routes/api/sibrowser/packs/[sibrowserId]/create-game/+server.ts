import { json } from '@sveltejs/kit'
import JSZip from 'jszip'
import { PUBLIC_ENGINE_URL } from '$env/static/public'

const SIBROWSER_BASE = 'https://www.sibrowser.ru'
const MAX_PACK_SIZE = 100 * 1024 * 1024 // 100MB
const MAPPING_PREFIX = 'sibrowser-cache/id-map/'

type SSEWriter = {
	progress: (msg: string) => void
	done: (data: Record<string, unknown>) => void
	error: (msg: string) => void
	close: () => void
}

function createSSEStream(): { response: Response; writer: SSEWriter } {
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
			close: () => w.close(),
		},
	}
}

export async function POST({ params, platform }) {
	if (!platform) {
		return json({ error: 'No platform found' }, { status: 500 })
	}

	const bucket = platform.env.JEOSHOW_PACKS
	const sibrowserId = params.sibrowserId

	// Fast path: cached mapping — no streaming needed
	const cachedMapping = await bucket.get(`${MAPPING_PREFIX}${sibrowserId}`)
	if (cachedMapping) {
		const hash = await cachedMapping.text()
		const engineResponse = await fetch(`${PUBLIC_ENGINE_URL}/create-game`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ packId: hash }),
		})
		if (engineResponse.ok) {
			return json(await engineResponse.json())
		}
	}

	// Slow path: download, extract, upload — stream progress
	const { response, writer } = createSSEStream()

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

			writer.progress('Создание игры...')

			const engineResponse = await fetch(`${PUBLIC_ENGINE_URL}/create-game`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ packId: hash }),
			})

			if (!engineResponse.ok) {
				writer.error('Не удалось создать игру')
				return
			}

			const engineData = (await engineResponse.json()) as {
				gameCode: string
				packName: string
			}
			writer.done(engineData)
		} catch (e) {
			console.error('create-game SSE error:', e)
			writer.error('Произошла непредвиденная ошибка')
		}
	}

	run()

	return response
}
