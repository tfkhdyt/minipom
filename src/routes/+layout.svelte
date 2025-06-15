<script lang="ts">
	import '@/app.css';
	import { configStore, getConfig } from '@/stores/config.store';
	import { dataStore, getData } from '@/stores/data.store';
	import '@fontsource-variable/montserrat';
	import { onMount } from 'svelte';

	let isLoading = true;
	let error: string | null = null;

	function getErrorMessage(err: unknown): string {
		if (err instanceof Error) {
			return err.message;
		}
		if (typeof err === 'string') {
			return err;
		}
		return 'An unexpected error occurred while loading the application';
	}

	onMount(async () => {
		try {
			const [data, config] = await Promise.all([getData(), getConfig()]);

			// Always set the store values, even if they're default values
			$dataStore = data;
			$configStore = config;
		} catch (err) {
			error = getErrorMessage(err);
		} finally {
			isLoading = false;
		}
	});
</script>

{#if isLoading}
	<div
		class="flex flex-col items-center justify-center min-h-screen bg-slate-800">
		<div
			class="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mb-4">
		</div>
		<p class="text-slate-300 font-medium">Loading your pomodoro...</p>
	</div>
{:else if error}
	<div
		class="flex flex-col items-center justify-center min-h-screen bg-slate-800">
		<div
			class="rounded-full h-12 w-12 bg-red-900/50 flex items-center justify-center mb-4">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-6 w-6 text-red-400"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
			</svg>
		</div>
		<p class="text-red-400 font-medium mb-2">Failed to load data</p>
		<p class="text-slate-300 text-sm">{error}</p>
	</div>
{:else}
	<slot />
{/if}
