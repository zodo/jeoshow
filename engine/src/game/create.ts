import { SiqXmlContentParser } from 'src/siq/xml-parser'
import type { GameState } from './state/models'

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
	const mediaMappingJson = (await mediaMapping?.json()) as Record<string, string>
	const parser = new SiqXmlContentParser(contentXml, mediaMappingJson)
	const packModel = parser.convert()

	const state: GameState = {
		pack: packModel,
		mediaMapping: mediaMappingJson || {},
		players: [],
		stage: { type: 'before-start' },
		scheduledCommands: [],
	}

	ctx.state.storage.put('state', JSON.stringify(state))
}
