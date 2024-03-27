import { SiqXmlContentParser } from 'src/siq/xml-parser'
import { saveMetadata } from './metadata'
import type { GameState } from './models/state'

export const createState = async (env: CfEnv, packId: string): Promise<GameState> => {
	const contentObject = await env.JEOSHOW_PACKS.get('packs/' + packId + '/content.xml')
	if (!contentObject) {
		throw new Error('Pack not found')
	}
	const contentXml = await contentObject.text()

	const mediaMapping = await env.JEOSHOW_PACKS.get('packs/' + packId + '/mapping.json')
	const mediaMappingJson = ((await mediaMapping?.json()) as Record<string, string>) ?? {}
	const parser = new SiqXmlContentParser(contentXml, packId, mediaMappingJson)
	const packModel = parser.convert()

	const kv = env.JEOSHOW_PACKS_METADATA
	await saveMetadata(kv, { id: packId, model: packModel, mediaMapping: mediaMappingJson })

	return {
		packId,
		players: [],
		stage: { type: 'before-start' },
		scheduledCommands: [],
	}
}
