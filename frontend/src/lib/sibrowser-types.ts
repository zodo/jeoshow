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
