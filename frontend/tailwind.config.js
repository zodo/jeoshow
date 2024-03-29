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
				background: {
					DEFAULT: '#fdf6e3',
					darker: '#f3e0c3',
				},
				danger: '#ff6b6b',
				warn: '#ffd166',
				accent: {
					DEFAULT: '#ffad5a',
					dark: '#f57c00',
				},
				neutral: '#b8a398',
				text: '#4e342e',
			},
		},
	},
	plugins: [require('tailwind-safe-container')],
}
