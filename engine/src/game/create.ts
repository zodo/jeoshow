import { SiqXmlContentParser } from 'src/siq/xml-parser'
import type { GameState } from './state/models'
import { saveMetadata } from './metadata'

export interface ExecutionContext {
	state: DurableObjectState
	env: CfEnv
}

export const initGame = async (ctx: ExecutionContext, packId: string) => {
	const contentObject = await ctx.env.JEOSHOW_PACKS.get('packs/' + packId + '/content.xml')
	if (!contentObject) {
		throw new Error('Pack not found')
	}
	const contentXml = await contentObject.text()

	const mediaMapping = await ctx.env.JEOSHOW_PACKS.get('packs/' + packId + '/mapping.json')
	const mediaMappingJson = ((await mediaMapping?.json()) as Record<string, string>) ?? {}
	const parser = new SiqXmlContentParser(contentXml, mediaMappingJson)
	const packModel = parser.convert()

	const kv = ctx.env.JEOSHOW_PACKS_METADATA
	await saveMetadata(kv, { id: packId, model: packModel, mediaMapping: mediaMappingJson })

	const state: GameState = {
		packId,
		players: [],
		stage: { type: 'before-start' },
		scheduledCommands: [],
	}

	ctx.state.storage.put('state', state)
}
