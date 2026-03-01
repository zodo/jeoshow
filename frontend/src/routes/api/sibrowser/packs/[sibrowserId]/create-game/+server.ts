import { PUBLIC_ENGINE_URL } from '$env/static/public'

export async function POST({ params, request }) {
	const sibrowserId = params.sibrowserId
	let packMetadata: unknown = undefined
	try {
		packMetadata = await request.json()
	} catch {
		// No body or invalid JSON — proceed without metadata
	}

	const engineResponse = await fetch(`${PUBLIC_ENGINE_URL}/process-sibrowser-pack`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sibrowserId, packMetadata }),
	})

	return new Response(engineResponse.body, {
		status: engineResponse.status,
		headers: {
			'Content-Type': engineResponse.headers.get('Content-Type') ?? 'application/json',
		},
	})
}
