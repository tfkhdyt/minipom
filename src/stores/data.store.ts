import type { Data } from '@/types';
import { debounce } from '@/utils';
import { BaseDirectory } from '@tauri-apps/api/path';
import {
	exists,
	mkdir,
	readTextFile,
	writeTextFile
} from '@tauri-apps/plugin-fs';
import { writable } from 'svelte/store';

export async function getData() {
	const isDataDirExists = await exists('', {
		baseDir: BaseDirectory.AppData
	});
	if (!isDataDirExists) {
		await mkdir('', { baseDir: BaseDirectory.AppData });
	}

	const defaultData: Data = {
		activeTask: null,
		tasks: [],
		reps: 1,
		pomodoroState: 'pomodoro' as const,
		lastTime: null,
		elapsedSinceStateChange: 0
	};

	const isDataFileExists = await exists('data.json', {
		baseDir: BaseDirectory.AppData
	});
	if (!isDataFileExists) {
		console.log('data.json not found, creating default data');
		await writeTextFile('data.json', JSON.stringify(defaultData, null, 2), {
			baseDir: BaseDirectory.AppData
		});
		return defaultData;
	}

	try {
		const data = await readTextFile('data.json', {
			baseDir: BaseDirectory.AppData
		});
		const currentData = JSON.parse(data) as Data;
		currentData.reps ??= 1;
		currentData.pomodoroState ??= 'pomodoro';
		currentData.activeTask ??= null;
		currentData.tasks ??= [];
		currentData.lastTime ??= null;
		currentData.elapsedSinceStateChange ??= 0;

		return currentData;
	} catch (error) {
		console.error('Error reading data.json, using default data:', error);
		return defaultData;
	}
}

export const dataStore = writable<Data>();

const debouncedWrite = debounce(async (value: Data) => {
	console.log('debouncedWrite', value);

	await writeTextFile('data.json', JSON.stringify(value, null, 2), {
		baseDir: BaseDirectory.AppData
	});
}, 500); // 500ms debounce delay

dataStore.subscribe(debouncedWrite);
