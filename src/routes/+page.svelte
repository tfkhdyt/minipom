<script lang="ts">
	import Card from '@/components/Card.svelte';
	import Count from '@/components/Count.svelte';
	import Tasks from '@/components/task/Tasks.svelte';
	import Progress from '@/components/ui/progress/progress.svelte';
	import { configStore } from '@/stores/config.store';
	import { dataStore } from '@/stores/data.store';
	import type { ButtonState } from '@/types';
	import { cn } from '@/utils';
	import { webviewWindow } from '@tauri-apps/api';
	import { invoke } from '@tauri-apps/api/core';
	import { TauriEvent } from '@tauri-apps/api/event';
	import { confirm } from '@tauri-apps/plugin-dialog';
	import {
		isPermissionGranted,
		requestPermission
	} from '@tauri-apps/plugin-notification';
	import { exit } from '@tauri-apps/plugin-process';
	import { onDestroy, onMount } from 'svelte';
	import { match } from 'ts-pattern';

	$: longBreakInterval = $configStore.timer.longBreakInterval;

	let buttonState: ButtonState = 'paused';

	$: targetMinutes = match($dataStore.pomodoroState)
		.with('pomodoro', () => $configStore.timer.time.pomodoro)
		.with('short-break', () => $configStore.timer.time.shortBreak)
		.with('long-break', () => $configStore.timer.time.longBreak)
		.exhaustive();
	$: timeLeft = targetMinutes * 60;
	$: timer = `${Math.floor(timeLeft / 60)
		.toString()
		.padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`;
	$: progress = 100 - (timeLeft / 60 / targetMinutes) * 100;

	let lastTimeInterval: number;
	onMount(async () => {
		timeLeft = $dataStore.lastTime ?? targetMinutes * 60;

		lastTimeInterval = setInterval(async () => {
			$dataStore.lastTime = timeLeft;
		}, 5000);
	});

	let intervalId: number;

	let permissionGranted: boolean;
	onMount(async () => {
		permissionGranted = await isPermissionGranted();

		if (!permissionGranted) {
			const permission = await requestPermission();
			permissionGranted = permission === 'granted';
		}
	});

	onMount(() => {
		webviewWindow
			.getCurrentWebviewWindow()
			.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, async () => {
				$dataStore.lastTime = timeLeft;

				await exit();
			});
	});

	async function updateTimer() {
		timeLeft--;
		const minutes = Math.floor(timeLeft / 60);
		const seconds = timeLeft % 60;

		const formattedMinutes = minutes.toString().padStart(2, '0');
		const formattedSeconds = seconds.toString().padStart(2, '0');

		timer = `${formattedMinutes}:${formattedSeconds}`;

		if (timeLeft < 0) {
			await nextStep();
			await invoke('play_transition_audio');
		}
	}

	async function incrementActiveTaskAct() {
		$dataStore.tasks = $dataStore.tasks.map((task) => {
			if (task.id === $dataStore.activeTask) {
				return {
					...task,
					act: task.act + 1
				};
			}
			return task;
		});
	}

	async function autoCheckTask() {
		const activeTask = $dataStore.tasks.find(
			(t) => t.id === $dataStore.activeTask
		);

		if (
			$configStore.task.autoCheckTasks &&
			activeTask &&
			activeTask.act >= activeTask.est
		) {
			$dataStore.tasks = $dataStore.tasks.map((t) => {
				if (t.id === $dataStore.activeTask) {
					return {
						...t,
						done: true
					};
				}
				return t;
			});

			if ($configStore.task.autoSwitchTasks) {
				await switchTask(activeTask.id);
			}
		}
	}

	async function switchTask(id: number) {
		const task = $dataStore.tasks.find((task) => task.id === id);

		if (task && task.done) {
			$dataStore.tasks = [
				...$dataStore.tasks.filter((it) => it.id !== id),
				task
			];

			const lastUndone = $dataStore.tasks.findLast((it) => it.done === false);
			if (lastUndone) {
				$dataStore.activeTask = lastUndone.id;
			}
		}
	}

	async function nextStep() {
		clearInterval(intervalId);

		pause();

		if (
			$dataStore.pomodoroState === 'pomodoro' &&
			$dataStore.reps % longBreakInterval !== 0
		) {
			await invoke('send_notification', {
				title: 'Time to take a short break!'
			});
			$dataStore.pomodoroState = 'short-break';
			$dataStore.lastTime = null;

			timeLeft = targetMinutes * 60;

			await incrementActiveTaskAct();
			await autoCheckTask();

			if ($configStore.timer.autoStart.breaks) {
				startInterval();
			}
		} else if (
			$dataStore.pomodoroState === 'pomodoro' &&
			$dataStore.reps % longBreakInterval === 0
		) {
			await invoke('send_notification', {
				title: 'Time to take a long break!'
			});
			$dataStore.pomodoroState = 'long-break';
			$dataStore.lastTime = null;

			timeLeft = targetMinutes * 60;

			await incrementActiveTaskAct();
			await autoCheckTask();

			if ($configStore.timer.autoStart.breaks) {
				startInterval();
			}
		} else {
			$dataStore.reps = $dataStore.reps + 1;
			await invoke('send_notification', {
				title: 'Time to focus!'
			});
			$dataStore.pomodoroState = 'pomodoro';
			$dataStore.lastTime = null;

			timeLeft = targetMinutes * 60;

			if ($configStore.timer.autoStart.pomodoros) {
				startInterval();
			}
		}
	}

	function startInterval() {
		buttonState = 'playing';

		clearInterval(intervalId);
		intervalId = setInterval(updateTimer, 1000);
	}

	function pause() {
		clearInterval(intervalId);
		buttonState = 'paused';
	}

	async function resetReps() {
		const confirmed = await confirm(
			'Do you want to reset the pomodoro count?',
			{
				kind: 'warning'
			}
		);

		if (confirmed) {
			pause();
			$dataStore.reps = 1;
			$dataStore.lastTime = null;
			$dataStore.pomodoroState = 'pomodoro';

			timeLeft = targetMinutes * 60;
		}
	}

	async function handleClick() {
		if (buttonState === 'paused') {
			startInterval();
		} else {
			pause();
		}
		await invoke('play_button_press');
	}

	onDestroy(() => {
		clearInterval(intervalId);
		clearInterval(lastTimeInterval);
	});
</script>

<main
	class={cn(
		'mx-auto flex min-h-[100svh] py-4 flex-col text-center text-white transition duration-500',
		match($dataStore.pomodoroState)
			.with('pomodoro', () => 'bg-[#BA4949]')
			.with('short-break', () => 'bg-[#38858a]')
			.with('long-break', () => 'bg-[#397097]')
			.exhaustive(),
		$dataStore.tasks.length === 0 && 'justify-center'
	)}>
	<Progress
		value={progress}
		class={cn(
			'w-[450px] md:w-[500px] mx-auto mb-4 h-2 dark',
			match($dataStore.pomodoroState)
				.with('pomodoro', () => 'bg-[#c15c5c]')
				.with('short-break', () => 'bg-[#4c9196]')
				.with('long-break', () => 'bg-[#4d7fa2]')
				.exhaustive()
		)} />
	<Card {buttonState} {handleClick} {nextStep} {timer} />
	<Count reps={$dataStore.reps} {resetReps} />
	<Tasks {switchTask} reps={$dataStore.reps} {buttonState} />
</main>
