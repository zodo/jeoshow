export async function judgeLlm(
	apiKey: string,
	params: {
		questionText: string
		theme: string
		correctAnswers: string[]
		incorrectAnswers: string[]
		playerAnswer: string
	}
): Promise<boolean> {
	try {
		let userContent = `Тема: ${params.theme}`
		if (params.questionText) {
			userContent += `\nВопрос: ${params.questionText}`
		}
		userContent += `\nПравильный ответ: ${params.correctAnswers.join(', ')}`
		if (params.incorrectAnswers.length > 0) {
			userContent += `\nНеправильные ответы: ${params.incorrectAnswers.join(', ')}`
		}
		userContent += `\nОтвет игрока: ${params.playerAnswer}`

		const systemContent = [
			'You are an answer judge for a Russian-language trivia game (like Jeopardy).',
			'Decide if the player\'s answer means the same thing as the correct answer.',
			'ACCEPT if the answer conveys the same entity/concept: Russian transliterations of English words, abbreviations, synonyms, partial or full names in either direction, minor typos, different word order, extra prepositions.',
			'REJECT only if the answer refers to a clearly different thing.',
			'When in doubt, accept. Players are typing fast on phones.',
			'Respond with ONLY "YES" or "NO".',
		].join(' ')

		const messages = [
			{ role: 'system', content: systemContent },
			{ role: 'user', content: userContent },
		]

		console.log('LLM judge prompt:', JSON.stringify(messages))

		const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'anthropic/claude-haiku-4.5',
				messages,
				max_tokens: 3,
				temperature: 0,
			}),
		})

		if (!response.ok) {
			console.error('LLM judge error:', response.status, await response.text())
			return false
		}

		const data = (await response.json()) as {
			choices?: { message?: { content?: string } }[]
		}
		const content = data.choices?.[0]?.message?.content?.trim().toUpperCase() ?? ''
		console.log('LLM judge response:', content, 'for answer:', params.playerAnswer)
		return content.startsWith('YES')
	} catch (err) {
		console.error('LLM judge exception:', err)
		return false
	}
}
