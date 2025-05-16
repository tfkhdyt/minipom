<script lang="ts">
	import { SkipForwardIcon } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	export let nextStep: () => Promise<void>;
</script>

<button
	type="button"
	on:click={nextStep}
	class="absolute inset-y-5 right-14 focus:outline-none rounded-full h-fit p-2 dark hover:bg-background/15 transition"
	transition:fade={{ duration: 200 }}>
	<SkipForwardIcon class="h-8 w-8" />
</button>
