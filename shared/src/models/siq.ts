export namespace PackModel {
	export interface Pack {
		rounds: Round[]
	}

	export interface Round {
		name: string
		themes: Theme[]
		type: RoundType
	}

	export type RoundType = 'Standard' | 'Final'

	export interface Theme {
		name: string
		questions: Question[]
	}

	export interface Question {
		id: string
		fragments: Fragment[]
		answers: Answers
		price: number
	}

	export interface Answers {
		correct: string[]
		incorrect: string[]
		additional: Fragment[]
	}

	export type Fragment = Text | Image | Audio | Video

	export interface Text {
		type: 'Text'
		value: string
	}

	export interface Image {
		type: 'Image'
		url: string
	}

	export interface Audio {
		type: 'Audio'
		url: string
		time: number
	}

	export interface Video {
		type: 'Video'
		url: string
		time: number
	}
}
