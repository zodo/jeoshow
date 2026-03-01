import { json } from '@sveltejs/kit'
import { scrapePopularPacks } from '$lib/server/sibrowser-scraper'
import type { SibrowserListing, DownloadedPacksRegistry } from '$lib/sibrowser-types'

const CACHE_KEY = 'sibrowser-cache/listing.json'
const REGISTRY_KEY = 'sibrowser-cache/downloaded-registry.json'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000
const SCRAPE_TIMEOUT_MS = 10_000

async function readRegistry(bucket: R2Bucket): Promise<DownloadedPacksRegistry> {
	try {
		const obj = await bucket.get(REGISTRY_KEY)
		if (obj) return (await obj.json()) as DownloadedPacksRegistry
	} catch {
		// ignore
	}
	return { packs: [], updatedAt: 0 }
}

export async function GET({ platform, url }) {
	if (!platform) {
		return json({ error: 'No platform found' }, { status: 500 })
	}

	const bucket = platform.env.JEOSHOW_PACKS
	const forceRefresh = url.searchParams.get('refresh') === 'true'

	// Read registry in parallel with listing logic
	const registryPromise = readRegistry(bucket)

	let listing: SibrowserListing | null = null

	if (!forceRefresh) {
		try {
			const cached = await bucket.get(CACHE_KEY)
			if (cached) {
				const data: SibrowserListing = await cached.json()
				if (Date.now() - data.scrapedAt < CACHE_TTL_MS) {
					listing = data
				}
			}
		} catch {
			// Cache read failed, proceed to scrape
		}
	}

	if (!listing) {
		try {
			listing = await Promise.race([
				scrapePopularPacks(4),
				new Promise<never>((_, reject) =>
					setTimeout(() => reject(new Error('Scrape timeout')), SCRAPE_TIMEOUT_MS)
				),
			])
			await bucket.put(CACHE_KEY, JSON.stringify(listing))
		} catch {
			// If scrape fails, try returning stale cache
			try {
				const stale = await bucket.get(CACHE_KEY)
				if (stale) {
					listing = (await stale.json()) as SibrowserListing
				}
			} catch {
				// No cache available
			}
		}
	}

	const registry = await registryPromise
	const downloadedPackIds = registry.packs.map((p) => p.sibrowserId)

	if (listing) {
		return json({ ...listing, downloadedPackIds })
	}

	// Total failure: no sibrowser, no stale cache — return downloaded packs as fallback
	return json({
		packs: [],
		scrapedAt: 0,
		downloadedPackIds,
		fallbackPacks: registry.packs,
	})
}
