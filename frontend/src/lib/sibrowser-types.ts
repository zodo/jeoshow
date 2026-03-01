export interface SibrowserPack {
	id: string
	title: string
	author: string
	date: string
	fileSize: string
	filename: string
	downloadCount: number
	tags: string[]
	description: string
	rounds: { name: string; themes: string }[]
	logoUrl: string | null
}

export interface SibrowserListing {
	packs: SibrowserPack[]
	scrapedAt: number
}

export interface DownloadedPack {
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

export interface DownloadedPacksRegistry {
	packs: DownloadedPack[]
	updatedAt: number
}

export interface SibrowserPacksResponse extends SibrowserListing {
	downloadedPackIds: string[]
	fallbackPacks?: DownloadedPack[]
}
