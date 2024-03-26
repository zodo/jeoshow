<script lang="ts">
	import './app.css'
</script>

<div>
	<slot />
</div>

<style>
	div {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		width: 100%;
		padding: 1rem;
	}
</style>
