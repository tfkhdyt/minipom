<script lang="ts">
	import { dataStore } from '@/stores/data.store';
	import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
	import { onMount } from 'svelte';
	import { match } from 'ts-pattern';

	let appWindow: Awaited<ReturnType<typeof getCurrentWebviewWindow>>;

	onMount(() => {
		appWindow = getCurrentWebviewWindow();
	});

	export let resetReps: () => Promise<void>;
	export let reps: number;

	$: currentTaskTitle = $dataStore?.tasks.find(
		(it) => it.id === $dataStore?.activeTask
	)?.title;

	$: (async () => {
		if (typeof window === 'undefined' || !appWindow) return;

		switch ($dataStore?.pomodoroState) {
			case 'pomodoro':
				await appWindow.setTitle(
					`${currentTaskTitle ?? 'Time to focus!'} — Minipom`
				);
				break;
			case 'short-break':
			case 'long-break':
				await appWindow.setTitle(
					`${currentTaskTitle ?? 'Time for a break!'} — Minipom`
				);
				break;
		}
	})();
</script>

<div class="md:text-lg mt-4">
	<button
		type="button"
		on:click={resetReps}
		class="text-gray-300 hover:text-white focus:outline-none">
		#{reps}
	</button>
	<h3 class="font-medium select-none cursor-default">
		{currentTaskTitle ??
			match($dataStore?.pomodoroState)
				.with('pomodoro', () => 'Time to focus!')
				.otherwise(() => 'Time for a break!')}
	</h3>
</div>
