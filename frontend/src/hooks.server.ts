import { dev } from '$app/environment'

/*
  When developing, this hook will add proxy objects to the `platform` object which
  will emulate any bindings defined in `wrangler.toml`.
*/

let platform: App.Platform

if (dev) {
	const { getPlatformProxy } = await import('wrangler')
	platform = await getPlatformProxy({
		persist: {
			path: '../.wrangler/v3/',
		},
	})
}

export const handle = async ({ event, resolve }: { event: any; resolve: any }) => {
	if (platform) {
		event.platform = {
			...event.platform,
			...platform,
		}
	}

	return resolve(event)
}
