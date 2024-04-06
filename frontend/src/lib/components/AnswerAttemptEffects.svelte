<script lang="ts">
	import Confetti from 'svelte-confetti'

	export let type: 'correct' | 'incorrect'
</script>

{#if type === 'correct'}
	<div class="absolute bottom-0 left-0 h-2 w-1">
		<Confetti x={[0, 2]} y={[0, 2]} cone delay={[0, 50]} />
	</div>
	<div class="absolute bottom-0 right-0 h-2 w-1">
		<Confetti x={[-2, 0]} y={[0, 2]} cone delay={[250, 300]} />
	</div>
{/if}

{#if type === 'incorrect'}
	<div class="absolute bottom-0 left-0 h-2 w-1">
		<Confetti
			x={[0, 2]}
			y={[0, 2]}
			cone
			delay={[0, 500]}
			colorArray={['url(/poop.png)']}
			size={20}
			amount={10}
		/>
	</div>
	<div class="absolute bottom-0 right-0 h-2 w-1">
		<Confetti
			x={[-2, 0]}
			y={[0, 2]}
			cone
			delay={[0, 500]}
			colorArray={['url(/poop.png)']}
			size={20}
			amount={10}
		/>
	</div>
{/if}
