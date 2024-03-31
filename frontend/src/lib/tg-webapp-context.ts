import type { WebApp } from '@twa-dev/types'
import { getContext, setContext } from 'svelte'
import type { Readable } from 'svelte/store'

export const setWebappContext = (webApp: Readable<WebApp | null>) => {
	setContext('webapp', webApp)
}

export const getWebapp = (): Readable<WebApp> => {
	return getContext('webapp')
}
