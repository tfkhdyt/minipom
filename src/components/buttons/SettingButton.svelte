<script lang="ts">
	import { SettingsIcon } from 'lucide-svelte';
	import { fade } from 'svelte/transition';
</script>

<button
	type="button"
	class="absolute inset-y-5 left-14 focus:outline-none rounded-full h-fit p-2 dark hover:bg-background/15 transition"
	transition:fade={{ duration: 200 }}>
	<SettingsIcon class="h-8 w-8" />
</button>
