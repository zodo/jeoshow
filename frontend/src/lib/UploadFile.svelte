<script lang="ts">
	import JSZip from 'jszip'

	export let onFinished: (packId: string) => void

	let zipFile: File | null = null

	let progressPercent: number | null = null

	function handleFileChange(event: Event) {
		const input = event.target as HTMLInputElement
		if (input.files && input.files.length > 0) {
			zipFile = input.files[0]
		}
	}

	async function handleSubmit(event: Event) {
		if (!zipFile) {
			return
		}
		try {
			const hash = await calculateHash(zipFile)
			const zip = await JSZip.loadAsync(zipFile)

			const totalFiles = Object.keys(zip.files).length
			let currentFile = 0
			console.log(zip.files)

			for (const [relativePath, file] of Object.entries(zip.files)) {
				const content = await file.async('blob')
				const formData = new FormData()
				formData.append('file', content)
				formData.append('hash', hash)
				formData.append('path', relativePath)
				const response = await fetch(`/api/upload-client`, {
					method: 'POST',
					body: formData,
				})
				progressPercent = (++currentFile / totalFiles) * 100
			}

			onFinished(hash)
		} catch (err) {
			console.error('Error reading zip file:', err)
		}
	}

	async function calculateHash(file: File): Promise<string> {
		const reader = new FileReader()
		const result = new Promise<string>((resolve, reject) => {
			reader.onload = async (event) => {
				const arrayBuffer = event.target!!.result as ArrayBuffer
				const bytes = new Uint8Array(arrayBuffer)
				const digest = await crypto.subtle.digest('SHA-1', bytes)
				const str = Array.from(new Uint8Array(digest))
					.map((b) => b.toString(16).padStart(2, '0'))
					.join('')
				resolve(str)
			}
			reader.onerror = (event) => {
				reject(reader.error)
			}
		})
		reader.readAsArrayBuffer(file)

		return result
	}
</script>

<form method="post" enctype="multipart/form-data" on:submit|preventDefault={handleSubmit}>
	<input type="file" on:change={handleFileChange} />
	<button type="submit">Upload</button>
</form>

{#if progressPercent !== null}
	<p>Uploading... %</p>
	<progress value={progressPercent} max="100" />
{/if}
