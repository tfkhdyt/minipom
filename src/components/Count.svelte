<script lang="ts">
	import * as Tooltip from '@/components/ui/tooltip';
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

	// Memoized current task title
	let lastActiveTaskId: number | null = null;
	let cachedCurrentTaskTitle = '';
	$: {
		const activeTaskId = $dataStore?.activeTask;
		if (activeTaskId !== lastActiveTaskId) {
			cachedCurrentTaskTitle =
				$dataStore?.tasks.find((it) => it.id === activeTaskId)?.title ?? '';
			lastActiveTaskId = activeTaskId;
		}
	}
	$: currentTaskTitle = cachedCurrentTaskTitle;

	// Memoized window title updates - only update when relevant data changes
	let lastTitleData = '';
	$: {
		const titleData = `${currentTaskTitle}-${$dataStore?.pomodoroState}-${reps}`;
		if (
			titleData !== lastTitleData &&
			typeof window !== 'undefined' &&
			appWindow
		) {
			updateWindowTitle();
			lastTitleData = titleData;
		}
	}

	async function updateWindowTitle() {
		if (typeof window === 'undefined' || !appWindow) return;

		switch ($dataStore?.pomodoroState) {
			case 'pomodoro':
				await appWindow.setTitle(
					`${currentTaskTitle || 'Time to focus!'} — Minipom`
				);
				break;
			case 'short-break':
			case 'long-break':
				await appWindow.setTitle(
					`${currentTaskTitle || 'Time for a break!'} — Minipom`
				);
				break;
		}
	}
</script>

<div class="md:text-lg">
	<Tooltip.Root>
		<Tooltip.Trigger>
			<button
				type="button"
				on:click={resetReps}
				class="text-gray-300 hover:text-white focus:outline-none">
				#{reps}
			</button>
		</Tooltip.Trigger>
		<Tooltip.Content
			align="center"
			side="top"
			avoidCollisions={false}
			sideOffset={12}>
			<p>Reset reps count</p>
		</Tooltip.Content>
	</Tooltip.Root>
	<h3 class="font-medium select-none cursor-default">
		{currentTaskTitle ||
			match($dataStore?.pomodoroState)
				.with('pomodoro', () => 'Time to focus!')
				.otherwise(() => 'Time for a break!')}
	</h3>
</div>
