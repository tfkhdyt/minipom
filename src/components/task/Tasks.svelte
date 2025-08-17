<script lang="ts">
	import * as Tooltip from '@/components/ui/tooltip';
	import { configStore } from '@/stores/config.store';
	import { dataStore } from '@/stores/data.store';
	import type { ButtonState, Config, Task } from '@/types';
	import { cn } from '@/utils';
	import { add, format, formatDistanceToNowStrict } from 'date-fns';
	import { onDestroy, onMount } from 'svelte';
	import { dndzone, type DndEvent } from 'svelte-dnd-action';
	import { match } from 'ts-pattern';
	import AddTask from './AddTask.svelte';
	import ClearMenu from './ClearMenu.svelte';
	import EditTask from './EditTask.svelte';
	import TaskItem from './TaskItem.svelte';

	export let buttonState: ButtonState;
	export let switchTask: (id: number) => Promise<void>;
	export let reps: number;

	// Memoized task calculations - only recalculate when tasks change
	let lastTasksHash = '';
	let cachedTotalAct = 0;
	let cachedTotalEst = 0;

	$: {
		const tasksHash = JSON.stringify(
			$dataStore.tasks.map((t) => ({
				id: t.id,
				done: t.done,
				act: t.act,
				est: t.est
			}))
		);
		if (tasksHash !== lastTasksHash) {
			cachedTotalAct = $dataStore.tasks
				.filter((t) => !t.done)
				.reduce((a, b) => a + b.act, 0);
			cachedTotalEst = $dataStore.tasks
				.filter((t) => !t.done)
				.reduce((a, b) => a + b.est, 0);
			lastTasksHash = tasksHash;
		}
	}
	$: totalAct = cachedTotalAct;
	$: totalEst = cachedTotalEst;

	// Memoized finish time calculation
	let lastFinishAtInputs = '';
	let cachedFinishAtMinute = 0;
	$: {
		const inputs = `${totalAct}-${totalEst}-${reps}-${JSON.stringify($configStore.timer.time)}`;
		if (inputs !== lastFinishAtInputs) {
			cachedFinishAtMinute = calculateFinishAtMinute(
				totalAct,
				totalEst,
				reps,
				$configStore
			);
			lastFinishAtInputs = inputs;
		}
	}
	$: finishAtMinute = cachedFinishAtMinute;

	// Optimized date updates - only update every 5 minutes instead of every minute
	$: date = new Date();
	let intervalId: number;

	onMount(() => {
		intervalId = setInterval(() => {
			date = new Date();
		}, 300000); // Update every 5 minutes instead of every minute
	});

	onDestroy(() => {
		clearInterval(intervalId);
	});

	// Memoized finish time display
	let lastFinishAtMinuteValue = -1;
	let cachedFinishAt = '';
	let cachedFinishAtDistance = '';
	$: {
		if (finishAtMinute !== lastFinishAtMinuteValue) {
			const finishDate = add(date, { minutes: finishAtMinute });
			cachedFinishAt = format(finishDate, 'HH:mm');
			cachedFinishAtDistance = formatDistanceToNowStrict(finishDate);
			lastFinishAtMinuteValue = finishAtMinute;
		}
	}
	$: finishAt = cachedFinishAt;
	$: finishAtDistance = cachedFinishAtDistance;

	// Optimized finish time calculation with early exit
	function calculateFinishAtMinute(
		act: number,
		est: number,
		reps: number,
		config: Config
	) {
		if (est <= act) return 0; // Early exit if no more work needed

		let rep = reps;
		let result = 0;
		const remainingWork = est - act;

		// Use a more efficient calculation
		for (let i = 0; i < remainingWork; i++) {
			result += config.timer.time.pomodoro;
			if (rep % config.timer.longBreakInterval === 0) {
				result += config.timer.time.longBreak;
			} else {
				result += config.timer.time.shortBreak;
			}
			rep++;
		}

		return result;
	}

	const flipDurationMs = 200;
	function handleDnsConsider(e: CustomEvent<DndEvent<Task>>) {
		$dataStore.tasks = e.detail.items;
	}
	async function handleDndFinalize(e: CustomEvent<DndEvent<Task>>) {
		$dataStore.tasks = e.detail.items;
	}
</script>

<section class="w-[450px] md:w-[500px] mx-auto text-left space-y-4 px-0.5">
	<div
		class="font-bold text-lg py-4 border-b border-b-white/75 select-none cursor-default flex items-center justify-between">
		Tasks
		<Tooltip.Root>
			<Tooltip.Trigger><ClearMenu /></Tooltip.Trigger>
			<Tooltip.Content
				align="center"
				side="top"
				avoidCollisions={false}
				sideOffset={12}>
				<p>Options</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</div>
	<AddTask />
	{#if $dataStore.tasks.length > 0}
		<div
			use:dndzone={{
				items: $dataStore.tasks,
				flipDurationMs,
				dropTargetStyle: {
					outline: 'rgba(255, 255, 255, 0.25) solid 2.5px',
					borderRadius: '0.375rem'
				}
			}}
			on:consider={handleDnsConsider}
			on:finalize={handleDndFinalize}
			class="space-y-2">
			<!-- animate:flip={{ duration: flipDurationMs }} -->

			{#each $dataStore.tasks as item (item.id)}
				<TaskItem {buttonState} {item} {switchTask} />
			{/each}
		</div>
		{#if totalEst > 0}
			<div
				style="-webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);"
				class={cn(
					'flex space-x-6 items-baseline justify-center rounded-md px-2 py-6 text-center border border-white/20 shadow-xl',
					match($dataStore.pomodoroState)
						.with('pomodoro', () => 'bg-[#c15c5c]/70')
						.with('short-break', () => 'bg-[#4c9196]/70')
						.with('long-break', () => 'bg-[#4d7fa2]/70')
						.exhaustive()
				)}>
				<div class="text-white/75 font-medium">
					Pomos:
					<span class="text-white text-2xl font-semibold ml-1">{totalAct}</span>
					<span>/</span>
					<span class="text-white text-2xl font-semibold">
						{match(totalAct > totalEst)
							.with(true, () => totalAct)
							.otherwise(() => totalEst)}
					</span>
				</div>
				<div class="text-white/75 font-medium">
					Finish At:
					<span class="text-white text-2xl font-semibold ml-1">
						{finishAt}
					</span>
					<span class="ml-1">
						({finishAtDistance})
					</span>
				</div>
			</div>
		{/if}
	{/if}
</section>
<EditTask />
