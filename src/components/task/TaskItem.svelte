<script lang="ts">
	import * as Alert from '@/components/ui/alert';
	import * as ContextMenu from '@/components/ui/context-menu';
	import { configStore } from '@/stores/config.store';
	import { dataStore } from '@/stores/data.store';
	import { editTaskData, showEditTaskModal } from '@/stores/edit-task';
	import type { ButtonState, Task } from '@/types';
	import { cn } from '@/utils';
	import { invoke } from '@tauri-apps/api/core';
	import { confirm } from '@tauri-apps/plugin-dialog';
	import {
		CircleCheckIcon,
		PencilIcon,
		RotateCcwIcon,
		Trash2Icon
	} from 'lucide-svelte';
	import { match } from 'ts-pattern';

	export let buttonState: ButtonState;
	export let item: Task;
	export let switchTask: (id: number) => Promise<void>;

	$: canResetActPomodoro = item.act > 0;

	async function toggleMark(id: number) {
		$dataStore.tasks = $dataStore.tasks.map((it) => {
			if (it.id === id) {
				it.done = !it.done;
			}
			return it;
		});

		if ($configStore.task.autoSwitchTasks) {
			await switchTask(id);
		}
	}

	async function setActiveTask(id: number) {
		if (buttonState === 'playing') {
			const confirmed = await confirm('Do you want to switch task?', {
				kind: 'warning'
			});

			if (!confirmed) {
				return;
			}
		}
		$dataStore.activeTask = id;
	}

	async function editTask(id: number) {
		$showEditTaskModal = true;

		const task = $dataStore.tasks.find((task) => task.id === id);
		if (task) {
			$editTaskData = task;
		}
	}

	async function deleteTask(id: number) {
		const item = $dataStore.tasks.find((it) => it.id === id);

		if (item) {
			const confirmed = await confirm(
				`Are you sure you want to delete this task? (${item.title})`
			);

			if (confirmed) {
				$dataStore.tasks = $dataStore.tasks.filter((it) => it.id !== id);

				await invoke('send_notification', {
					title: 'Task has been deleted'
				});
			}
		}
	}

	async function resetActPomodoro(id: number) {
		$dataStore.tasks = $dataStore.tasks.map((t) => {
			if (t.id === id) {
				return {
					...t,
					act: 0
				};
			}

			return t;
		});
	}
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger asChild let:builder>
		<button
			use:builder.action
			{...builder}
			class={cn(
				'w-full bg-white rounded-md py-3 pl-3 pr-5 text-slate-700 font-semibold border-l-[6px] focus:outline-none space-y-2 cursor-grab',
				item.id === $dataStore.activeTask
					? 'border-l-black'
					: 'border-l-transparent hover:border-l-slate-300'
			)}
			on:click={async () => await setActiveTask(item.id)}>
			<div class="flex justify-between items-center">
				<div class="flex items-center decoration-4">
					<button
						class="focus:outline-none"
						on:click|stopPropagation={async () => await toggleMark(item.id)}>
						<CircleCheckIcon
							class="w-10 h-10 mr-2 hover:opacity-75"
							fill={match(item.done)
								.with(false, () => '#dfdfdf')
								.with(true, () => '#BA4949')
								.exhaustive()}
							color="white" />
					</button>
					<span class={cn(item.done && 'line-through opacity-50')}>
						{item.title}
					</span>
				</div>
				<div class="flex space-x-0.5 text-slate-400 items-baseline text-sm">
					<span class="text-xl font-semibold">{item.act}</span>
					<span>/</span>
					<span class="text-sm">{item.est}</span>
				</div>
			</div>

			{#if item.note}
				<Alert.Root class="block">
					<Alert.Description class="font-medium">
						{item.note}
					</Alert.Description>
				</Alert.Root>
			{/if}
		</button>
	</ContextMenu.Trigger>
	<ContextMenu.Content>
		<ContextMenu.Item on:click={async () => await editTask(item.id)}>
			<PencilIcon class="w-4 h-4 mr-2" />
			Update
		</ContextMenu.Item>
		<ContextMenu.Item
			on:click={async () => await resetActPomodoro(item.id)}
			disabled={!canResetActPomodoro}>
			<RotateCcwIcon class="w-4 h-4 mr-2" />
			Reset Act Pomodoro
		</ContextMenu.Item>
		<ContextMenu.Item on:click={async () => await deleteTask(item.id)}>
			<Trash2Icon class="w-4 h-4 mr-2" />
			Delete
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
