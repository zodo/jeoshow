import { json } from '@sveltejs/kit'
import { scrapePopularPacks } from '$lib/server/sibrowser-scraper'
import type { SibrowserListing } from '$lib/sibrowser-types'

const CACHE_KEY = 'sibrowser-cache/listing.json'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000

export async function GET({ platform, url }) {
	if (!platform) {
		return json({ error: 'No platform found' }, { status: 500 })
	}

	const bucket = platform.env.JEOSHOW_PACKS
	const forceRefresh = url.searchParams.get('refresh') === 'true'

	if (!forceRefresh) {
		try {
			const cached = await bucket.get(CACHE_KEY)
			if (cached) {
				const listing: SibrowserListing = await cached.json()
				if (Date.now() - listing.scrapedAt < CACHE_TTL_MS) {
					return json(listing)
				}
			}
		} catch {
			// Cache read failed, proceed to scrape
		}
	}

	try {
		const listing = await scrapePopularPacks(4)
		await bucket.put(CACHE_KEY, JSON.stringify(listing))
		return json(listing)
	} catch (e) {
		// If scrape fails, try returning stale cache
		try {
			const stale = await bucket.get(CACHE_KEY)
			if (stale) {
				return json(await stale.json())
			}
		} catch {
			// No cache available
		}
		return json({ error: 'Failed to fetch packs from sibrowser' }, { status: 502 })
	}
}
