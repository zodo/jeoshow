import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
	resolve: {
		alias: [
			{ find: /^shared\/(.*)/, replacement: path.resolve(__dirname, 'shared/src/$1') },
		],
	},
	test: {},
})
