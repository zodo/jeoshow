<script lang="ts">
	import UploadFile from '$lib/UploadFile.svelte'
	import Username from '$lib/Username.svelte'

	const onFileUploadFinished = (packId: string) => {
		console.log('File uploaded with id:', packId)
	}
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<Username />
	<UploadFile onFinished={onFileUploadFinished} />
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
