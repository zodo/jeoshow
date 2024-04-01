import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => ({
	plugins: [sveltekit()],
	server:
		(mode === 'cf-dev' && {
			hmr: {
				clientPort: 443,
			},
		}) ||
		undefined,
}))
