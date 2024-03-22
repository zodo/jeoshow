import { XMLParser } from 'fast-xml-parser'
import type { PackModel } from 'shared/models/siq'

export class SiqXmlContentParser {
	parser: XMLParser
	xml: string
	mediaMapping: Record<string, string>

	constructor(xml: string, mediaMapping: Record<string, string>) {
		this.xml = xml
		this.mediaMapping = mediaMapping
		this.parser = new XMLParser({
			ignoreAttributes: false,
			attributesGroupName: '$',
			attributeNamePrefix: '',
			textNodeName: '_',
			isArray: (name: string) =>
				['round', 'theme', 'question', 'answer', 'param'].includes(name),
		})
	}

	convert(): PackModel.Pack {
		const xml = this.parser.parse(this.xml)
		// console.log(JSON.stringify(xml, null, 2))
		const rounds = xml.package.rounds.round
			.map((round: any) => this.convertRound(round))
			.filter((r: any) => r !== undefined)
		return { rounds }
	}

	private convertRound(r: any): PackModel.Round | undefined {
		const themes: PackModel.Theme[] | undefined = r.themes?.theme
			?.map((t: any) => this.convertTheme(t))
			?.filter((t: any) => t !== undefined)

		if (!themes || themes.length === 0) {
			return undefined
		}

		return {
			name: r.$?.name ?? '?',
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
		const atoms = q.scenario?.atom ?? []
		if (atoms.length === 0) {
			return undefined
		}
		const markerIndex = atoms.findIndex((a: any) => a.$.type === 'marker')
		let questions: PackModel.Fragment[] = []
		let mediaAnswers: PackModel.Fragment[] = []

		if (markerIndex > 0) {
			questions = atoms.slice(0, markerIndex).map(this.mapAtom)
			mediaAnswers = atoms.slice(markerIndex + 1).map(this.mapAtom)
		} else {
			questions = atoms.map(this.mapAtom)
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

	private getNewQuestion(q: any, id: string): PackModel.Question {
		const params = q.params.param

		const questions = params
			.filter((p: any) => p.$.name === 'question')
			.map((p: any) => {
				return this.mapQuestionParam(p.item)
			})

		const answerMedia = params
			.filter((p: any) => p.$.name === 'answer')
			.map((p: any) => {
				return this.mapQuestionParam(p.item)
			})

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
		const type = a.$.type
		const content = a._
		const time = parseInt(a.$.time, 10)

		switch (type) {
			case 'say':
			case 'text':
			case '':
				return { type: 'Text', value: content }
			case 'image':
				return { type: 'Image', url: this.mapMediaUrl(content, 'Images/') }
			case 'voice':
			case 'audio':
				return { type: 'Audio', url: this.mapMediaUrl(content, 'Audio/'), time }
			case 'video':
				return { type: 'Video', url: this.mapMediaUrl(content, 'Video/'), time }
			default:
				throw new Error(`Unknown atom type: ${type}`)
		}
	}

	private mapQuestionParam(item: any): PackModel.Fragment[] {
		if (typeof item === 'string') {
			return [{ type: 'Text', value: item }]
		}
		if (Array.isArray(item)) {
			return item.map((i: any) => this.mapQuestionParamItem(i))
		}
		return [this.mapQuestionParamItem(item)]
	}

	private mapQuestionParamItem(item: any): PackModel.Fragment {
		if (typeof item === 'string') {
			return { type: 'Text', value: item }
		}
		const type = item.$?.type ?? 'text'
		const content = item._
		const duration = item.$?.duration
		let durationSeconds: number = 10
		if (duration) {
			const [hours, minutes, seconds] = duration.split(':').map((x: any) => parseInt(x, 10))
			durationSeconds = hours * 3600 + minutes * 60 + seconds
		}
		switch (type) {
			case 'say':
			case 'text':
			case '':
				return { type: 'Text', value: content }
			case 'image':
				return { type: 'Image', url: this.mapMediaUrl(content, 'Images/') }
			case 'voice':
			case 'audio':
				return {
					type: 'Audio',
					url: this.mapMediaUrl(content, 'Audio/'),
					time: durationSeconds,
				}
			case 'video':
				return {
					type: 'Video',
					url: this.mapMediaUrl(content, 'Video/'),
					time: durationSeconds,
				}
			default:
				throw new Error(`Unknown atom type: ${type}`)
		}
	}

	private mapMediaUrl(url: string, prefix: string): string {
		const urlEncoded = encodeURI(url)
		return (
			this.mediaMapping[prefix + url] ??
			this.mediaMapping[url] ??
			this.mediaMapping[prefix + urlEncoded] ??
			this.mediaMapping[urlEncoded] ??
			url
		)
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
}
