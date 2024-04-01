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
				'bg-main': 'var(--color-bg-main)',
				'bg-secondary': 'var(--color-bg-secondary)',
				'bg-section': 'var(--color-bg-section)',
				danger: 'var(--color-danger)',
				warn: 'var(--color-warn)',
				'bg-accent': 'var(--color-bg-accent)',
				'text-accent': 'var(--color-text-accent)',
				'text-neutral': 'var(--color-text-neutral)',
				'text-normal': 'var(--color-text-normal)',
				'text-header': 'var(--color-text-section-header)',
			},
		},
	},
	plugins: [require('tailwind-safe-container')],
}
