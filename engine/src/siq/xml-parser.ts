import { XMLParser } from 'fast-xml-parser'
import type { PackModel } from 'shared/models/siq'

export class SiqXmlContentParser {
	parser: XMLParser
	xml: string
	packId: string
	mediaMapping: Record<string, string>

	constructor(xml: string, packId: string, mediaMapping: Record<string, string>) {
		this.xml = xml
		this.packId = packId
		this.mediaMapping = mediaMapping
		this.parser = new XMLParser({
			ignoreAttributes: false,
			attributesGroupName: '$',
			attributeNamePrefix: '',
			textNodeName: '_',
			numberParseOptions: {
				hex: false,
				leadingZeros: false,
				skipLike: /.*/,
			},
			parseAttributeValue: false,
			isArray: (name: string) =>
				['round', 'theme', 'question', 'answer', 'param'].includes(name),
		})
	}

	convert(): PackModel.Pack {
		const xml = this.parser.parse(this.xml)
		// console.log(JSON.stringify(xml, null, 2))
		const rounds = (xml.package.rounds.round as any[])
			.map((round: any) => this.convertRound(round))
			.filter((r) => r !== undefined)
			.map((r, idx) => ({ ...r!!, id: idx.toString() }))
		return {
			name: xml.package.$?.name ?? 'no name',
			rounds,
		}
	}

	private convertRound(r: any): Omit<PackModel.Round, 'id'> | undefined {
		const themes: PackModel.Theme[] | undefined = r.themes?.theme
			?.map((t: any) => this.convertTheme(t))
			?.filter((t: any) => t !== undefined)

		if (!themes || themes.length === 0) {
			return undefined
		}

		return {
			name: r.$?.name ?? '?',
			comments: r.info?.comments ?? '',
			themes: themes,
			type: r.$?.type === 'final' ? 'Final' : 'Standard',
		}
	}

	private convertTheme(t: any): PackModel.Theme | undefined {
		const questions = t.questions?.question
			?.map((q: any, idx: number) => {
				const id = `${this.djb2Hash(t.$.name)}-${idx}`
				return this.mapQuestion(q, id)
			})
			?.filter((q: any) => q)

		if (!questions || questions.length === 0) {
			return undefined
		}

		return {
			name: t.$?.name ?? '?',
			comments: t.info?.comments ?? '',
			questions: questions,
		}
	}

	private mapQuestion(q: any, id: string): PackModel.Question | undefined {
		if (!q.right?.answer || q.right.answer.length === 0) {
			return undefined
		}

		return this.getLegacyQuestion(q, id) ?? this.getNewQuestion(q, id)
	}

	private getLegacyQuestion(q: any, id: string): PackModel.Question | undefined {
		const atoms = q.scenario?.atom
		let questions: PackModel.Fragment[] = []
		let mediaAnswers: PackModel.Fragment[] = []

		if (Array.isArray(atoms)) {
			const markerIndex = atoms.findIndex((a: any) => a.$?.type === 'marker')

			if (markerIndex > 0) {
				questions = atoms.slice(0, markerIndex).map((a: any) => this.mapAtom(a))
				mediaAnswers = atoms.slice(markerIndex + 1).map((a: any) => this.mapAtom(a))
			} else {
				questions = atoms.map((a: any) => this.mapAtom(a))
			}
		} else if (typeof atoms === 'object' || typeof atoms === 'string') {
			questions = [this.mapAtom(atoms)]
		} else {
			return undefined
		}

		if (mediaAnswers.filter((x) => x.type === 'text').length === 0) {
			const text: string = q.right.answer[0]
			mediaAnswers = [{ type: 'text', value: text }, ...mediaAnswers]
		}

		return {
			id: id,
			fragments: questions.map((f: PackModel.Fragment) => [f]),
			answers: {
				correct: q.right?.answer,
				incorrect: q.wrong?.answer,
				content: mediaAnswers.map((f: PackModel.Fragment) => [f]),
			},
			price: parseInt(q.$.price, 10),
		}
	}

	private getNewQuestion(q: any, id: string): PackModel.Question | undefined {
		const params = q?.params?.param

		if (!Array.isArray(params)) {
			return undefined
		}

		const questions = params
			.filter((p: any) => p.$.name === 'question')
			.map((p: any) => {
				return this.mapQuestionParam(p.item)
			})

		let answerMedia: PackModel.FragmentGroup[] = params
			.filter((p: any) => p.$.name === 'answer')
			.map((p: any) => {
				return this.mapQuestionParam(p.item)
			})
		if (answerMedia.flatMap((x) => x).filter((x) => x.type === 'text').length === 0) {
			const text: string = q.right.answer[0]
			answerMedia = [[{ type: 'text', value: text }], ...answerMedia]
		}

		return {
			id: id,
			fragments: questions,
			answers: {
				correct: q.right.answer,
				incorrect: q.wrong?.answer,
				content: answerMedia,
			},
			price: parseInt(q.$.price, 10),
		}
	}

	private mapAtom(a: any): PackModel.Fragment {
		if (typeof a === 'string') {
			return { type: 'text', value: this.cleanupText(a) }
		}
		if (Array.isArray(a)) {
			// string array
			const value = (a as string[]).map((x) => this.cleanupText(x)).join(' ')
			return { type: 'text', value }
		}
		const type = a.$?.type ?? ''
		const content = a._
		let time: number | undefined
		if (a.$?.time) {
			time = parseInt(a.$.time, 10)
		}

		switch (type) {
			case 'say':
			case 'text':
			case '':
				return { type: 'text', value: this.cleanupText(content) }
			case 'image':
				return { type: 'image', url: this.mapMediaUrl(content, 'Images/') }
			case 'voice':
			case 'audio':
				return { type: 'audio', url: this.mapMediaUrl(content, 'Audio/'), time }
			case 'video':
				return { type: 'video', url: this.mapMediaUrl(content, 'Video/'), time }
			default:
				throw new Error(`Unknown atom type: ${type}`)
		}
	}

	private mapQuestionParam(item: any): PackModel.Fragment[] {
		if (typeof item === 'string') {
			return [{ type: 'text', value: item }]
		}
		if (Array.isArray(item)) {
			return item.map((i: any) => this.mapQuestionParamItem(i))
		}
		return [this.mapQuestionParamItem(item)]
	}

	private mapQuestionParamItem(item: any): PackModel.Fragment {
		if (typeof item === 'string') {
			return { type: 'text', value: this.cleanupText(item) }
		}
		const type = item.$?.type ?? 'text'
		const content = item._
		const duration = item.$?.duration
		let durationSeconds: number | undefined
		if (duration) {
			const [hours, minutes, seconds] = duration.split(':').map((x: any) => parseInt(x, 10))
			durationSeconds = hours * 3600 + minutes * 60 + seconds
		}
		switch (type) {
			case 'say':
			case 'text':
			case '':
				return { type: 'text', value: this.cleanupText(content) }
			case 'image':
				return { type: 'image', url: this.mapMediaUrl(content, 'Images/') }
			case 'voice':
			case 'audio':
				return {
					type: 'audio',
					url: this.mapMediaUrl(content, 'Audio/'),
					time: durationSeconds,
				}
			case 'video':
				return {
					type: 'video',
					url: this.mapMediaUrl(content, 'Video/'),
					time: durationSeconds,
				}
			default:
				throw new Error(`Unknown atom type: ${type}`)
		}
	}

	private mapMediaUrl(url: string, prefix: string): string {
		if (!url) {
			return ''
		}
		if (url.startsWith('@')) {
			url = url.slice(1)
		}
		const urlEncoded = encodeURI(url)
		const newMediaUrl =
			this.mediaMapping[prefix + url] ??
			this.mediaMapping[url] ??
			this.mediaMapping[prefix + urlEncoded] ??
			this.mediaMapping[urlEncoded] ??
			url
		if (newMediaUrl.startsWith('http')) {
			return newMediaUrl
		} else {
			return `${this.packId}/${newMediaUrl}`
		}
	}

	private djb2Hash(str: string): string {
		let hash = 5381 // Initial seed
		for (let i = 0; i < str.length; i++) {
			// Bit-shift hash to the left and add the current character code
			hash = (hash * 33) ^ str.charCodeAt(i)
		}
		// Ensure the hash is within the 32-bit integer range and return it
		const numHash = hash >>> 0
		return numHash.toString(16)
	}

	private cleanupText(text: string): string {
		return text.replace(/\s+/g, ' ').replaceAll('\n', ' ').replaceAll('\r', ' ').trim()
	}
}
