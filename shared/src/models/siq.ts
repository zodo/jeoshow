export namespace PackModel {
	export interface Pack {
		name: string
		rounds: Round[]
	}

	export interface Round {
		id: string
		name: string
		comments?: string
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

	export type SelectAnswerOption = {
		name: string
		text: string
	}

	export type Answers =
		| {
				type: 'regular'
				correct: string[]
				incorrect?: string[]
				content: FragmentGroup[]
		  }
		| {
				type: 'select'
				options: SelectAnswerOption[]
				correctName: string
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
