import { SiqXmlContentParser } from 'src/siq/xml-parser'
import { GameState } from './models/state'

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

	const packModel = await SiqXmlContentParser.convert(contentXml)
	const mediaMapping = await ctx.env.JEOSHOW_PACKS.get('packs/' + packId + '/mapping.json')
	const mediaMappingJson = (await mediaMapping?.json()) as Record<string, string>

	const state: GameState = {
		pack: packModel,
		mediaMapping: mediaMappingJson || {},
		players: [],
		stage: { type: 'BeforeStart' },
	}

	ctx.state.storage.put('state', JSON.stringify(state))
}
