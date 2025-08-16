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
	const defaultData: Data = {
		activeTask: null,
		tasks: [],
		reps: 1,
		pomodoroState: 'pomodoro' as const,
		lastTime: null
	};

	try {
		const isDataDirExists = await exists('.', {
			baseDir: BaseDirectory.AppData
		});
		if (!isDataDirExists) {
			await mkdir('.', { baseDir: BaseDirectory.AppData });
		}

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

		const data = await readTextFile('data.json', {
			baseDir: BaseDirectory.AppData
		});
		const currentData = JSON.parse(data) as Data;
		currentData.reps ??= 1;
		currentData.pomodoroState ??= 'pomodoro';
		currentData.activeTask ??= null;
		currentData.tasks ??= [];
		currentData.lastTime ??= null;

		return currentData;
	} catch (error) {
		console.error('Error in getData, using default data:', error);
		return defaultData;
	}
}

// Initialize with default data to prevent undefined values on first load
const defaultData: Data = {
	activeTask: null,
	tasks: [],
	reps: 1,
	pomodoroState: 'pomodoro' as const,
	lastTime: null
};

export const dataStore = writable<Data>(defaultData);

// Direct save function for immediate data persistence (used on app exit)
export async function saveDataDirectly(data: Data) {
	console.log('saveDataDirectly', data);
	await writeTextFile('data.json', JSON.stringify(data, null, 2), {
		baseDir: BaseDirectory.AppData
	});
}

// Keep debounced write for normal operations (when user makes changes)
const debouncedWrite = debounce(async (value: Data) => {
	console.log('debouncedWrite', value);

	await writeTextFile('data.json', JSON.stringify(value, null, 2), {
		baseDir: BaseDirectory.AppData
	});
}, 500); // 500ms debounce delay

dataStore.subscribe(debouncedWrite);
