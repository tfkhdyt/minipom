<script lang="ts">
	import * as DropdownMenu from '@/components/ui/dropdown-menu';
	import { dataStore } from '@/stores/data.store';
	import { confirm } from '@tauri-apps/plugin-dialog';
	import { sendNotification } from '@tauri-apps/plugin-notification';
	import {
		EllipsisVerticalIcon,
		ListChecksIcon,
		RotateCcwIcon,
		Trash2Icon
	} from 'lucide-svelte';
	import { Button } from '../ui/button';

	$: canClearFinishedTasks = $dataStore?.tasks.some((t) => t.done);
	$: canResetActPomodoros =
		$dataStore?.tasks &&
		$dataStore?.tasks?.length > 0 &&
		($dataStore?.tasks?.map((t) => t.act).reduce((a, b) => a + b, 0) ?? 0) > 0;
	$: canClearAllTasks = $dataStore?.tasks && $dataStore?.tasks?.length > 0;

	async function clearFinishedTasks() {
		const confirmed = await confirm(
			'Are you sure want to clear all finished tasks?'
		);

		if (confirmed) {
			$dataStore.tasks = $dataStore?.tasks.filter(
				(task) => task.done === false
			);

			sendNotification('Finished tasks has been cleared');
		}
	}

	async function resetActPomodoros() {
		const confirmed = await confirm(
			'Are you sure want to reset all act pomodoros count?'
		);

		if (confirmed) {
			$dataStore.tasks = $dataStore?.tasks.map((t) => ({
				...t,
				act: 0
			}));

			sendNotification('All act pomodoros count has been reset');
		}
	}

	async function clearAllTasks() {
		const confirmed = await confirm('Are you sure want to clear all tasks?');

		if (confirmed) {
			$dataStore.tasks = [];

			sendNotification('All tasks has been cleared');
		}
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		<Button size="icon" variant="ghost" class="hover:bg-white">
			<EllipsisVerticalIcon />
		</Button>
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Group>
			<DropdownMenu.Item
				disabled={!canClearFinishedTasks}
				on:click={clearFinishedTasks}
				class="cursor-pointer">
				<ListChecksIcon class="w-4 h-4 mr-2" />
				Clear finished tasks
			</DropdownMenu.Item>
			<DropdownMenu.Item
				disabled={!canResetActPomodoros}
				on:click={resetActPomodoros}
				class="cursor-pointer">
				<RotateCcwIcon class="w-4 h-4 mr-2" />
				Reset act pomodoros
			</DropdownMenu.Item>
			<DropdownMenu.Separator />
			<DropdownMenu.Item disabled={!canClearAllTasks} on:click={clearAllTasks}>
				<Trash2Icon class="w-4 h-4 mr-2" />
				Clear all tasks
			</DropdownMenu.Item>
		</DropdownMenu.Group>
	</DropdownMenu.Content>
</DropdownMenu.Root>
