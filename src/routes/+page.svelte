<script lang="ts">
	import Card from '@/components/Card.svelte';
	import Count from '@/components/Count.svelte';
	import Tasks from '@/components/task/Tasks.svelte';
	import Progress from '@/components/ui/progress/progress.svelte';
	import { configStore } from '@/stores/config.store';
	import { dataStore, saveDataDirectly } from '@/stores/data.store';
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

	// Stores are now initialized with default values, so we can safely access them
	$: longBreakInterval = $configStore.timer.longBreakInterval;

	let buttonState: ButtonState = 'paused';
	let elapsedSinceStateChange = 0;

	$: targetMinutes = match($dataStore.pomodoroState)
		.with('pomodoro', () => $configStore.timer.time.pomodoro)
		.with('short-break', () => $configStore.timer.time.shortBreak)
		.with('long-break', () => $configStore.timer.time.longBreak)
		.exhaustive();
	$: timeLeft = targetMinutes * 60;

	// Memoized timer display - only recalculate when timeLeft changes significantly
	let lastTimeLeft = -1;
	let cachedTimer = '';
	$: {
		if (Math.abs(timeLeft - lastTimeLeft) >= 1) {
			const minutes = Math.floor(timeLeft / 60);
			const seconds = timeLeft % 60;
			cachedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
			lastTimeLeft = timeLeft;
		}
	}
	$: timer = cachedTimer;

	// Memoized progress calculation
	let lastProgressTimeLeft = -1;
	let cachedProgress = 0;
	$: {
		if (Math.abs(timeLeft - lastProgressTimeLeft) >= 1) {
			cachedProgress = 100 - (timeLeft / 60 / targetMinutes) * 100;
			lastProgressTimeLeft = timeLeft;
		}
	}
	$: progress = cachedProgress;

	// Memoized elapsed timer display
	let lastElapsed = -1;
	let cachedElapsedTimer = '';
	$: {
		if (elapsedSinceStateChange !== lastElapsed) {
			const minutes = Math.floor(elapsedSinceStateChange / 60);
			const seconds = elapsedSinceStateChange % 60;
			cachedElapsedTimer = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
			lastElapsed = elapsedSinceStateChange;
		}
	}
	$: elapsedTimer = cachedElapsedTimer;

	// Single consolidated timer interval
	let mainIntervalId: number;

	onMount(async () => {
		// Set timeLeft based on saved data or default
		timeLeft = $dataStore.lastTime ?? targetMinutes * 60;

		// Start consolidated timer that handles both countdown and elapsed time
		mainIntervalId = setInterval(() => {
			// Update elapsed time when paused
			if (buttonState === 'paused') {
				elapsedSinceStateChange++;
			}

			// Update countdown timer when playing
			if (buttonState === 'playing' && timeLeft > 0) {
				timeLeft--;

				if (timeLeft < 0) {
					nextStep();
					invoke('play_transition_audio');
				}
			}
		}, 1000);

		// Permission setup
		let permissionGranted = await isPermissionGranted();
		if (!permissionGranted) {
			const permission = await requestPermission();
			permissionGranted = permission === 'granted';
		}
	});

	onMount(() => {
		webviewWindow
			.getCurrentWebviewWindow()
			.listen(TauriEvent.WINDOW_CLOSE_REQUESTED, async () => {
				// Save current data directly before exit (no debouncing)
				const currentData = {
					...$dataStore,
					lastTime: timeLeft
				};
				await saveDataDirectly(currentData);
				await exit();
			});
	});

	// Memoized task operations
	function incrementActiveTaskAct() {
		const activeTaskId = $dataStore.activeTask;
		if (!activeTaskId) return;

		$dataStore.tasks = $dataStore.tasks.map((task) => {
			if (task.id === activeTaskId) {
				return { ...task, act: task.act + 1 };
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
					return { ...t, done: true };
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
			} else {
				$dataStore.activeTask = null;
			}
		}
	}

	async function nextStep() {
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
			elapsedSinceStateChange = 0;
			timeLeft = targetMinutes * 60;

			incrementActiveTaskAct();
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
			elapsedSinceStateChange = 0;
			timeLeft = targetMinutes * 60;

			incrementActiveTaskAct();
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
			elapsedSinceStateChange = 0;
			timeLeft = targetMinutes * 60;

			if ($configStore.timer.autoStart.pomodoros) {
				startInterval();
			}
		}
	}

	function startInterval() {
		buttonState = 'playing';
	}

	function pause() {
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
			elapsedSinceStateChange = 0;
			timeLeft = targetMinutes * 60;
		}
	}

	async function handleClick() {
		if (buttonState === 'paused') {
			startInterval();
		} else {
			pause();
		}

		// Reset elapsed timer when button state changes
		elapsedSinceStateChange = 0;
		await invoke('play_button_press');
	}

	onDestroy(() => {
		if (mainIntervalId) {
			clearInterval(mainIntervalId);
		}
	});
</script>

<main
	class={cn(
		'mx-auto flex min-h-[100svh] flex-col text-center text-white transition duration-500 fixed-gradient-bg',
		match($dataStore.pomodoroState)
			.with('pomodoro', () => 'pomodoro-bg')
			.with('short-break', () => 'short-break-bg')
			.with('long-break', () => 'long-break-bg')
			.exhaustive()
	)}>
	<!-- Sticky section containing Progress, Card, and Count -->
	<div
		class={cn(
			'sticky top-0 z-10 py-4 transition duration-500',
			$dataStore.tasks.length === 0 && 'flex-1 flex flex-col justify-center'
		)}>
		<Progress
			value={progress}
			style="-webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);"
			class={cn(
				'w-[450px] md:w-[500px] mx-auto mb-4 h-3 dark border border-white/20 shadow-xl',
				match($dataStore.pomodoroState)
					.with('pomodoro', () => 'bg-[#c15c5c]/70')
					.with('short-break', () => 'bg-[#4c9196]/70')
					.with('long-break', () => 'bg-[#4d7fa2]/70')
					.exhaustive()
			)} />
		<Card {buttonState} {handleClick} {nextStep} {timer} {elapsedTimer} />
	</div>

	<Count reps={$dataStore.reps} {resetReps} />
	<!-- Tasks section -->
	<div class="flex-1 pb-6">
		<Tasks {switchTask} reps={$dataStore.reps} {buttonState} />
	</div>
</main>

<style>
	.fixed-gradient-bg {
		position: relative;
	}

	.fixed-gradient-bg::before {
		content: '';
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		z-index: -1;
		transition: background 0.5s ease;
	}

	.pomodoro-bg::before {
		background: linear-gradient(to bottom, #ba4949, #6b2c2c);
	}

	.short-break-bg::before {
		background: linear-gradient(to bottom, #38858a, #1f4a4d);
	}

	.long-break-bg::before {
		background: linear-gradient(to bottom, #397097, #1f3a52);
	}
</style>
