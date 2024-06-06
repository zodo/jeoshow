import posthog from 'posthog-js'
import { browser } from '$app/environment'
import { PUBLIC_POSTGHOG_API_KEY } from '$env/static/public'

export const load = async () => {
	if (browser) {
		posthog.init(PUBLIC_POSTGHOG_API_KEY, {
			api_host: 'https://eu.i.posthog.com',
			person_profiles: 'always',
		})
	}
	return
}
