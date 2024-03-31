/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,svelte}'],
	theme: {
		fontFamily: {
			mono: ['Menlo', 'Consolas', 'Monaco', 'Liberation Mono', 'Lucida Console', 'monospace'],
			sans: [
				'-apple-system',
				'BlinkMacSystemFont',
				'avenir next',
				'avenir',
				'segoe ui',
				'helvetica neue',
				'helvetica',
				'Cantarell',
				'Ubuntu',
				'roboto',
				'noto',
				'arial',
				'sans-serif',
			],
			serif: [
				'Iowan Old Style',
				'Apple Garamond',
				'Baskerville',
				'Times New Roman',
				'Droid Serif',
				'Times',
				'Source Serif Pro',
				'serif',
			],
		},
		extend: {
			colors: {
				background: 'var(--color-background)',
				'background-darker': 'var(--color-background-darker)',
				danger: 'var(--color-danger)',
				warn: 'var(--color-warn)',
				accent: 'var(--color-accent)',
				'accent-dark': 'var(--color-accent-dark)',
				neutral: 'var(--color-neutral)',
				text: 'var(--color-text)',
			},
		},
	},
	plugins: [require('tailwind-safe-container')],
}
