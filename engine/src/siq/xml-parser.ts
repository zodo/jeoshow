import { PackModel } from 'shared/models/pack/siq'
import { parseStringPromise } from 'xml2js'

export class SiqXmlContentParser {
	public static async convert(xmlString: string): Promise<PackModel.Pack> {
		const xml = await parseStringPromise(xmlString, { explicitArray: false })
		const rounds = xml.rounds.round.map((r: any) => this.convertRound(r))
		return { rounds }
	}

	private static convertRound(r: any): PackModel.Round {
		return {
			id: r.$.name, // Assuming XML structure allows access to attributes this way
			name: r.$.name,
			themes: r.themes.theme.map((t: any) => this.convertTheme(t, r.$.name)),
			typ: r.$.type === 'final' ? 'Final' : 'Standard',
		}
	}

	private static convertTheme(t: any, roundName: string): PackModel.Theme {
		return {
			id: t.$.name,
			name: t.$.name,
			questions: t.questions.question.map((q: any) => this.mapQuestion(t.$.name, q)),
		}
	}

	private static mapQuestion(themeName: string, q: any): PackModel.Question {
		const atoms = q.scenario.atom
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
			id: `${themeName}-${q.$.price}`,
			fragments: questions,
			answers: {
				correct: q.right.answer.map((a: any) => a._),
				incorrect: q.wrong.answer.map((a: any) => a._),
				additional: mediaAnswers,
			},
			price: parseInt(q.$.price, 10),
			theme: themeName,
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
}
