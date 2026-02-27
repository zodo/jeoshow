import type { SibrowserPack, SibrowserListing } from '$lib/sibrowser-types'

const SIBROWSER_BASE = 'https://www.sibrowser.ru'

export async function scrapePopularPacks(pageCount = 4): Promise<SibrowserListing> {
	const allPacks: SibrowserPack[] = []
	for (let page = 1; page <= pageCount; page++) {
		const packs = await scrapePage(page)
		allPacks.push(...packs)
	}
	return { packs: allPacks.filter((p) => parseSizeMb(p.fileSize) <= 100), scrapedAt: Date.now() }
}

async function scrapePage(page: number): Promise<SibrowserPack[]> {
	const url = `${SIBROWSER_BASE}/?sort=download_count&page=${page}`
	const response = await fetch(url, {
		headers: { 'User-Agent': 'Jeoshow/1.0' },
	})
	if (!response.ok) {
		throw new Error(`Failed to fetch sibrowser page ${page}: ${response.status}`)
	}
	const html = await response.text()
	return parseArticles(html)
}

function parseArticles(html: string): SibrowserPack[] {
	const articles = html.split('<article')
	// First element is everything before the first article
	articles.shift()

	const packs: SibrowserPack[] = []
	for (const articleHtml of articles) {
		try {
			const pack = parseArticle(articleHtml)
			if (pack) {
				packs.push(pack)
			}
		} catch {
			// Skip malformed cards
		}
	}
	return packs
}

function parseArticle(html: string): SibrowserPack | null {
	const id = extractFirst(html, /href="\/packages\/(\d+)"/)
	if (!id) return null

	const title = extractFirst(html, /itemprop="name headline">\s*<a[^>]*>([^<]+)<\/a>/)?.trim()
	if (!title) return null

	const author =
		extractFirst(html, /itemprop="author"[\s\S]*?itemprop="name">\s*([^<]+)<\/span>/)?.trim() ??
		'Unknown'

	const date = extractFirst(html, /<time datetime="([^"]+)"/) ?? ''

	const fileSize = extractFirst(html, /itemprop="contentSize">([^<]+)</)?.trim() ?? ''

	const filename = extractFirst(html, /itemprop="alternateName">\s*([^<]+)</)?.trim() ?? ''

	const downloadCountStr = extractFirst(
		html,
		/download_count_package_\d+">\s*(\d+)\s*<\/span>/
	)
	const downloadCount = downloadCountStr ? parseInt(downloadCountStr, 10) : 0

	const tags: string[] = []
	const tagRegex = /rel="tag"[^>]*>\s*<span[^>]*>\s*([^<]+)\s*<\/span>/g
	let tagMatch
	while ((tagMatch = tagRegex.exec(html)) !== null) {
		tags.push(tagMatch[1].trim())
	}

	const description = extractFirst(html, /itemprop="description">([^<]+)</)?.trim() ?? ''

	const rounds: { name: string; themes: string }[] = []
	const themesBlock = html.match(/Темы в раундах[\s\S]*?<\/div>/)
	if (themesBlock) {
		const roundRegex = /(?:^|\n)\s*([^<\n]+?):\s*<span[^>]*>\s*([\s\S]*?)\s*<\/span>/g
		let roundMatch
		while ((roundMatch = roundRegex.exec(themesBlock[0])) !== null) {
			const name = roundMatch[1].trim()
			const themes = roundMatch[2].replace(/\s+/g, ' ').trim()
			if (name && themes) {
				rounds.push({ name, themes })
			}
		}
	}

	const logoSrc = extractFirst(html, /itemprop="image"[^>]*src="([^"]+)"/)
	const logoUrl = logoSrc && logoSrc.endsWith('.webp') ? `${SIBROWSER_BASE}${logoSrc}` : null

	return {
		id,
		title,
		author,
		date,
		fileSize,
		filename,
		downloadCount,
		tags,
		description,
		rounds,
		logoUrl,
	}
}

function parseSizeMb(size: string): number {
	const match = size.replace(',', '.').match(/([\d.]+)\s*(МБ|MB|ГБ|GB)/i)
	if (!match) return 0
	const value = parseFloat(match[1])
	if (match[2].toUpperCase().startsWith('Г') || match[2].toUpperCase().startsWith('G')) {
		return value * 1024
	}
	return value
}

function extractFirst(html: string, regex: RegExp): string | null {
	const match = html.match(regex)
	return match ? match[1] : null
}
