<script lang="ts">
	import * as Dialog from '@/components/ui/dialog';
	import { dataStore } from '@/stores/data.store';
	import { cn } from '@/utils';
	import { invoke } from '@tauri-apps/api/core';
	import { SaveIcon } from 'lucide-svelte';
	import { Button } from '../ui/button';
	import { Input } from '../ui/input';
	import { Label } from '../ui/label';
	import { Textarea } from '../ui/textarea';

	let title: string | null = null;
	let estPomodoros = 1;
	let note: string | null = null;

	let addNote = false;

	let open = false;
	function onOpenChange() {
		open = !open;
		addNote = false;
	}

	async function handleSave() {
		if (!title) {
			await invoke('send_notification', {
				title: 'Title should not be empty'
			});
			return;
		}

		$dataStore.tasks = [
			{
				id: Date.now(),
				act: 0,
				done: false,
				est: estPomodoros,
				title,
				note
			},
			...$dataStore.tasks
		];

		await invoke('send_notification', {
			title: 'New task has been added'
		});

		open = false;
		estPomodoros = 1;
		title = null;
		addNote = false;
		note = null;
	}
</script>

<Dialog.Root {open} {onOpenChange}>
	<Dialog.Trigger class="w-full focus:outline-none" asChild let:builder>
		<button
			use:builder.action
			{...builder}
			class={cn(
				'w-full bg-black/10 rounded-md p-5 text-white/55 hover:text-white/70 font-bold focus:outline-none border-white/55 hover:border-white/70 border-2 border-dashed'
			)}>
			Add Task
		</button>
	</Dialog.Trigger>
	<Dialog.Content>
		<Dialog.Header>
			<Dialog.Title>Add New Task</Dialog.Title>
		</Dialog.Header>
		<div class="space-y-4">
			<Input
				required
				bind:value={title}
				type="text"
				placeholder="What are you working on?"
				class="border-none ring-0 outline-none focus-visible:ring-0 rounded-none placeholder:text-lg placeholder:italic placeholder:text-gray-200 placeholder:font-semibold -ml-3 text-lg text-gray-700 font-semibold" />
			<div class="flex flex-col gap-3 mt-4">
				<Label for="est-pomodoros">Est Pomodoros</Label>
				<Input
					required
					type="number"
					id="est-pomodoros"
					placeholder="4"
					bind:value={estPomodoros}
					min={1}
					class="w-[80px]" />
			</div>
			{#if addNote}
				<Textarea bind:value={note} placeholder="Some notes..." />
			{:else}
				<button
					class="underline font-medium text-sm"
					on:click={() => (addNote = true)}>+ Add Note</button>
			{/if}
		</div>
		<Dialog.Footer>
			<Button type="button" on:click={handleSave}>
				<SaveIcon class="w-4 h-4 mr-2" />
				Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
