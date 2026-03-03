import type { PackModel } from 'shared/models/siq'

type JudgeParams = {
	questionText: string
	theme: string
	correctAnswers: string[]
	incorrectAnswers: string[]
	playerAnswer: string
}

const systemPrompt = [
	'You are an answer judge for a Russian-language trivia game (like Jeopardy).',
	"Decide if the player's answer means the same thing as the correct answer.",
	'',
	'ACCEPT when:',
	'- The answer conveys the same entity/concept.',
	'- Russian transliterations of English words or vice versa (e.g. "Бэтмен" = "Batman").',
	'- Abbreviations, synonyms, different word order, extra prepositions.',
	'- Different grammatical forms of the same word: cases (мертвец/мертвеца), number, tense, etc.',
	'- Partial name of a SINGLE entity: surname alone, first name alone, short title (e.g. "Пушкин" = "Александр Сергеевич Пушкин").',
	'- Minor typos — players are typing fast on phones.',
	'',
	'REJECT when:',
	'- The answer refers to a clearly different thing.',
	'- The question/topic explicitly asks for MULTIPLE components (e.g. "назвать игру и предмет") and the player omits a required component entirely. Partial name of one component is fine, but skipping a whole component is not.',
	'',
	'The correct answer field may contain author notes in parentheses like "(полное название)", "(назвать автора и произведение)", etc. These are instructions about WHAT the answer should contain, not exact text to match. Extract the actual answer from around these notes.',
	'',
	'When in doubt, accept.',
].join('\n')

function formatEntry(params: JudgeParams): string {
	let text = `Тема: ${params.theme}`
	if (params.questionText) {
		text += `\nВопрос: ${params.questionText}`
	}
	text += `\nПравильный ответ: ${params.correctAnswers.join(', ')}`
	if (params.incorrectAnswers.length > 0) {
		text += `\nНеправильные ответы: ${params.incorrectAnswers.join(', ')}`
	}
	text += `\nОтвет игрока: ${params.playerAnswer}`
	return text
}

export function extractQuestionText(fragments: PackModel.FragmentGroup[]): string {
	return fragments
		.flatMap((fg) => fg)
		.map((f) => {
			switch (f.type) {
				case 'text':
					return f.value
				case 'image':
					return '<img>'
				case 'audio':
					return '<audio>'
				case 'video':
					return '<video>'
			}
		})
		.join(' ')
}

async function callLlm(
	apiKey: string,
	messages: { role: string; content: string }[],
	responseFormat: object,
	maxTokens: number
): Promise<string | null> {
	const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${apiKey}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			model: 'anthropic/claude-haiku-4.5',
			messages,
			max_tokens: maxTokens,
			temperature: 0,
			response_format: responseFormat,
		}),
	})

	if (!response.ok) {
		console.error('LLM judge error:', response.status, await response.text())
		return null
	}

	const data = await response.json()
	console.log('LLM judge raw response:', JSON.stringify(data))
	const typed = data as {
		choices?: { message?: { content?: string } }[]
	}
	return typed.choices?.[0]?.message?.content ?? null
}

const singleSchema = {
	type: 'json_schema',
	json_schema: {
		name: 'verdict',
		strict: true,
		schema: {
			type: 'object',
			properties: {
				reasoning: {
					type: 'string',
					description: 'Brief reasoning for the verdict (1-2 sentences)',
				},
				correct: {
					type: 'boolean',
					description: 'Whether the player answer is correct',
				},
			},
			required: ['reasoning', 'correct'],
			additionalProperties: false,
		},
	},
}

export async function judgeLlm(apiKey: string, params: JudgeParams): Promise<boolean> {
	try {
		const messages = [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: formatEntry(params) },
		]

		console.log('LLM judge prompt:', JSON.stringify(messages))

		const content = await callLlm(apiKey, messages, singleSchema, 150)
		if (content === null) return false

		console.log('LLM judge response:', content, 'for answer:', params.playerAnswer)
		const parsed = JSON.parse(content) as { reasoning: string; correct: boolean }
		return parsed.correct
	} catch (err) {
		console.error('LLM judge exception:', err)
		return false
	}
}

export type BatchEntry = JudgeParams & { playerId: string }

export async function judgeLlmBatch(
	apiKey: string,
	entries: BatchEntry[]
): Promise<Record<string, boolean>> {
	const result: Record<string, boolean> = {}

	try {
		const userContent = entries
			.map((entry, i) => `--- #${i + 1} ---\n${formatEntry(entry)}`)
			.join('\n\n')

		const messages = [
			{
				role: 'system',
				content:
					systemPrompt +
					` You will receive ${entries.length} player answers to judge. Return a verdict for each, using its number as "id".`,
			},
			{ role: 'user', content: userContent },
		]

		console.log('LLM judge batch prompt:', JSON.stringify(messages))

		const batchSchema = {
			type: 'json_schema',
			json_schema: {
				name: 'batch_verdicts',
				strict: true,
				schema: {
					type: 'object',
					properties: {
						verdicts: {
							type: 'array',
							description: `One verdict per player answer`,
							items: {
								type: 'object',
								properties: {
									id: {
										type: 'integer',
										description: 'The answer number from input (1, 2, ...)',
									},
									reasoning: {
										type: 'string',
										description: 'Brief reasoning for the verdict (1-2 sentences)',
									},
									correct: {
										type: 'boolean',
										description: 'Whether the player answer is correct',
									},
								},
								required: ['id', 'reasoning', 'correct'],
								additionalProperties: false,
							},
						},
					},
					required: ['verdicts'],
					additionalProperties: false,
				},
			},
		}

		const content = await callLlm(apiKey, messages, batchSchema, 300 * entries.length)
		if (content !== null) {
			console.log('LLM judge batch response:', content)
			const parsed = JSON.parse(content) as {
				verdicts: { id: number; reasoning: string; correct: boolean }[]
			}

			for (const v of parsed.verdicts) {
				const idx = v.id - 1 // 1-based → 0-based
				if (idx >= 0 && idx < entries.length) {
					result[entries[idx].playerId] = v.correct
				}
			}
		}
	} catch (err) {
		console.error('LLM judge batch exception:', err)
	}

	// Fallback: individually judge any entries missing from batch result
	const missing = entries.filter((e) => !(e.playerId in result))
	if (missing.length > 0) {
		console.log(`LLM judge batch: falling back to individual calls for ${missing.length} entries`)
		await Promise.all(
			missing.map(async (entry) => {
				result[entry.playerId] = await judgeLlm(apiKey, entry)
			})
		)
	}

	return result
}
