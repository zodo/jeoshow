import { XMLParser } from 'fast-xml-parser'
import type { PackModel } from 'shared/models/siq'

export class SiqXmlContentParser {
	public static convert(xmlString: string): PackModel.Pack {
		const parser = new XMLParser({
			ignoreAttributes: false,
			attributesGroupName: '$',
			attributeNamePrefix: '',
			isArray: (name: string) => ['round', 'theme', 'question', 'answer'].includes(name),
		})
		const xml = parser.parse(xmlString)
		const rounds = xml.package.rounds.round.map(this.convertRound)
		return { rounds }
	}

	private static convertRound(r: any): PackModel.Round {
		return {
			name: r.$.name,
			themes: r.themes.theme.map((t: any) => SiqXmlContentParser.convertTheme(t)),
			type: r.$.type === 'final' ? 'Final' : 'Standard',
		}
	}

	private static convertTheme(t: any): PackModel.Theme {
		return {
			name: t.$.name,
			questions: t.questions.question.map((q: any, idx: number) => {
				const id = `${this.djb2Hash(t.$.name)}-${idx}`
				return this.mapQuestion(q, id)
			}),
		}
	}

	private static mapQuestion(q: any, id: string): PackModel.Question {
		const atoms = q.scenario?.atom ?? []
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
			fragments: questions,
			answers: {
				correct: q.right.answer,
				incorrect: q.wrong?.answer,
				additional: mediaAnswers,
			},
			price: parseInt(q.$.price, 10),
		}
	}

	private static mapAtom(a: any): PackModel.Fragment {
		const type = a.$.type
		const content = a._
		const time = parseInt(a.$.time, 10)

		switch (type) {
			case 'say':
			case 'text':
			case '':
				return { type: 'Text', value: content }
			case 'image':
				return { type: 'Image', url: content }
			case 'voice':
				return { type: 'Audio', url: content, time }
			case 'video':
				return { type: 'Video', url: content, time }
			default:
				throw new Error(`Unknown atom type: ${type}`)
		}
	}

	private static djb2Hash(str: string): string {
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
