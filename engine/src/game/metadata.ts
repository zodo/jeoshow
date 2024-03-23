import type { PackModel } from 'shared/models/siq'

export interface PackMetadata {
	id: string
	model: PackModel.Pack
	mediaMapping: Record<string, string>
}

export const saveMetadata = async (kv: KVNamespace, metadata: PackMetadata) => {
	await kv.put(`metadata-${metadata.id}`, JSON.stringify(metadata))
}

export const loadMetadata = async (
	kv: KVNamespace,
	packId: string
): Promise<PackMetadata | undefined> => {
	const metadata = await kv.get(`metadata-${packId}`)
	if (!metadata) {
		return undefined
	}
	return JSON.parse(metadata)
}
