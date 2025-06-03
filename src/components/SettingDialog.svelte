<script lang="ts">
	import { Button } from '@/components/ui/button';
	import * as Dialog from '@/components/ui/dialog';
	import { Input } from '@/components/ui/input';
	import { Label } from '@/components/ui/label';
	import { Switch } from '@/components/ui/switch';
	import * as Tooltip from '@/components/ui/tooltip';
	import { defaultConfig } from '@/constants';
	import { configStore } from '@/stores/config.store';
	import { invoke } from '@tauri-apps/api/core';
	import {
		ClockIcon,
		InfoIcon,
		RotateCcwIcon,
		SaveIcon,
		SquareCheckBigIcon
	} from 'lucide-svelte';
	import SettingButton from './buttons/SettingButton.svelte';

	let pomodoro = $configStore.timer.time.pomodoro;
	let shortBreak = $configStore.timer.time.shortBreak;
	let longBreak = $configStore.timer.time.longBreak;
	let autoStartBreaks = $configStore.timer.autoStart.breaks;
	let autoStartPomodoros = $configStore.timer.autoStart.pomodoros;
	let longBreakInterval = $configStore.timer.longBreakInterval;
	let autoCheckTasks = $configStore.task.autoCheckTasks;
	let autoSwitchTasks = $configStore.task.autoSwitchTasks;

	async function saveConfig() {
		$configStore.timer.time.pomodoro = pomodoro;
		$configStore.timer.time.shortBreak = shortBreak;
		$configStore.timer.time.longBreak = longBreak;
		$configStore.timer.autoStart.breaks = autoStartBreaks;
		$configStore.timer.autoStart.pomodoros = autoStartPomodoros;
		$configStore.timer.longBreakInterval = longBreakInterval;
		$configStore.task.autoCheckTasks = autoCheckTasks;
		$configStore.task.autoSwitchTasks = autoSwitchTasks;

		await invoke('send_notification', {
			title: 'Setting has been saved'
		});
	}

	async function restoreDefault() {
		$configStore = defaultConfig;
		pomodoro = $configStore.timer.time.pomodoro;
		shortBreak = $configStore.timer.time.shortBreak;
		longBreak = $configStore.timer.time.longBreak;
		autoStartBreaks = $configStore.timer.autoStart.breaks;
		autoStartPomodoros = $configStore.timer.autoStart.pomodoros;
		longBreakInterval = $configStore.timer.longBreakInterval;
		autoCheckTasks = $configStore.task.autoCheckTasks;
		autoSwitchTasks = $configStore.task.autoSwitchTasks;

		await invoke('send_notification', {
			title: 'Setting has been restored to default'
		});
	}
</script>

<Dialog.Root>
	<Dialog.Trigger class="focus:outline-none">
		<Tooltip.Root>
			<Tooltip.Trigger><SettingButton /></Tooltip.Trigger>
			<Tooltip.Content
				align="center"
				side="top"
				avoidCollisions={false}
				sideOffset={12}>
				<p>Settings</p>
			</Tooltip.Content>
		</Tooltip.Root>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Settings</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-4">
			<h2 class="flex items-center font-medium text-slate-700">
				<ClockIcon class="w-5 h-5 mr-2" />
				Timer
			</h2>
			<div class="space-y-6">
				<div class="space-y-2">
					<p class="font-semibold text-slate-700">Time (minutes)</p>
					<div class="grid grid-cols-3 gap-6">
						<div>
							<Label for="pomodoro" class="font-medium text-slate-700">
								Pomodoro
							</Label>
							<Input
								type="number"
								id="pomodoro"
								placeholder="25"
								required
								bind:value={pomodoro} />
						</div>
						<div>
							<Label for="short-break" class="font-medium text-slate-700">
								Short Break
							</Label>
							<Input
								type="number"
								id="short-break"
								placeholder="5"
								required
								bind:value={shortBreak} />
						</div>
						<div>
							<Label for="long-break" class="font-medium text-slate-700">
								Long Break
							</Label>
							<Input
								type="number"
								id="long-break"
								placeholder="15"
								required
								bind:value={longBreak} />
						</div>
					</div>
				</div>
				<div class="flex justify-between items-center">
					<Label
						for="auto-start-break"
						class="font-medium text-slate-700 w-full">Auto Start Breaks</Label>
					<Switch id="auto-start-break" bind:checked={autoStartBreaks} />
				</div>
				<div class="flex justify-between items-center">
					<Label
						for="auto-start-pomodoros"
						class="font-medium text-slate-700 w-full">
						Auto Start Pomodoros
					</Label>
					<Switch id="auto-start-pomodoros" bind:checked={autoStartPomodoros} />
				</div>
				<div class="flex justify-between items-center">
					<Label
						for="long-break-interval"
						class="font-medium text-slate-700 w-full">
						Long Break Interval
					</Label>
					<Input
						type="number"
						id="long-break-interval"
						placeholder="4"
						class="w-24"
						required
						bind:value={longBreakInterval} />
				</div>
			</div>
		</div>
		<div class="space-y-4 border-t-2 pt-6 mt-4">
			<h2 class="flex items-center font-medium text-slate-700">
				<SquareCheckBigIcon class="w-5 h-5 mr-2" />
				Task
			</h2>
			<div class="space-y-6">
				<div class="flex justify-between items-center">
					<div class="flex items-center">
						<Label
							for="auto-check-tasks"
							class="font-medium text-slate-700 w-full">Auto Check Tasks</Label>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<InfoIcon
									class="ml-1 hover:opacity-75"
									fill="#B2B2B2"
									color="white" />
							</Tooltip.Trigger>
							<Tooltip.Content class="max-w-[300px]">
								<p>
									If you enable "Auto Check Tasks", the active task will be
									automatically checked when the actual pomodoro count reaches
									the estimated count.
								</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</div>
					<Switch id="auto-check-tasks" bind:checked={autoCheckTasks} />
				</div>
				<div class="flex justify-between items-center">
					<div class="flex items-center">
						<Label
							for="auto-switch-tasks"
							class="font-medium text-slate-700 w-full">
							Auto Switch Tasks
						</Label>
						<Tooltip.Root>
							<Tooltip.Trigger>
								<InfoIcon
									class="ml-1 hover:opacity-75"
									fill="#B2B2B2"
									color="white" />
							</Tooltip.Trigger>
							<Tooltip.Content class="max-w-[300px]">
								<p>
									If you enable "Auto Switch Tasks", the checked task will be
									automatically moved to the bottom of the task list.
								</p>
							</Tooltip.Content>
						</Tooltip.Root>
					</div>
					<Switch id="auto-switch-tasks" bind:checked={autoSwitchTasks} />
				</div>
			</div>
		</div>
		<Dialog.Footer class="mt-4 gap-2">
			<Button type="button" variant="destructive" on:click={restoreDefault}>
				<RotateCcwIcon class="h-4 w-4 mr-2" />
				Restore Default
			</Button>
			<Button type="button" on:click={saveConfig}>
				<SaveIcon class="h-4 w-4 mr-2" />
				Save changes
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
