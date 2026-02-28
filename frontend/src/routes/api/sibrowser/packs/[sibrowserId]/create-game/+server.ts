import { PUBLIC_ENGINE_URL } from '$env/static/public'

export async function POST({ params }) {
	const sibrowserId = params.sibrowserId

	const engineResponse = await fetch(`${PUBLIC_ENGINE_URL}/process-sibrowser-pack`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ sibrowserId }),
	})

	return new Response(engineResponse.body, {
		status: engineResponse.status,
		headers: {
			'Content-Type': engineResponse.headers.get('Content-Type') ?? 'application/json',
		},
	})
}
