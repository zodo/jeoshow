export namespace PackModel {
	export interface Pack {
		rounds: Round[]
	}

	export interface Round {
		idx: number
		name: string
		themes: Theme[]
		type: RoundType
	}

	export type RoundType = 'Standard' | 'Final'

	export interface Theme {
		name: string
		comments?: string
		questions: Question[]
	}

	export interface Question {
		id: string
		fragments: FragmentGroup[]
		answers: Answers
		price: number
	}

	export interface Answers {
		correct: string[]
		incorrect: string[]
		content: FragmentGroup[]
	}

	export type FragmentGroup = Fragment[]

	export type Fragment = Text | Image | Audio | Video

	export interface Text {
		type: 'text'
		value: string
	}

	export interface Image {
		type: 'image'
		url: string
	}

	export interface Audio {
		type: 'audio'
		url: string
		time?: number
	}

	export interface Video {
		type: 'video'
		url: string
		time?: number
	}
}
