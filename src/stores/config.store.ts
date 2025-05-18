import { defaultConfig } from '@/constants';
import type { Config } from '@/types';
import { debounce } from '@/utils';
import { BaseDirectory } from '@tauri-apps/api/path';
import {
	exists,
	mkdir,
	readTextFile,
	writeTextFile
} from '@tauri-apps/plugin-fs';
import { writable } from 'svelte/store';

export async function getConfig() {
	const isConfigDirExists = await exists('', {
		baseDir: BaseDirectory.AppConfig
	});
	if (!isConfigDirExists) {
		await mkdir('', { baseDir: BaseDirectory.AppConfig });
	}

	const isConfigFileExists = await exists('config.json', {
		baseDir: BaseDirectory.AppConfig
	});
	if (!isConfigFileExists) {
		console.log('config.json not found, creating default config');
		await writeTextFile('config.json', JSON.stringify(defaultConfig, null, 2), {
			baseDir: BaseDirectory.AppConfig
		});
		return defaultConfig;
	}

	try {
		const contents = await readTextFile('config.json', {
			baseDir: BaseDirectory.AppConfig
		});
		const currentConfig = JSON.parse(contents) as Config;
		return currentConfig;
	} catch (error) {
		console.error('Error reading config.json, using default config:', error);
		return defaultConfig;
	}
}

export const configStore = writable<Config>();

const debouncedWrite = debounce(async (value: Config) => {
	console.log('debouncedWrite', value);
	await writeTextFile('config.json', JSON.stringify(value, null, 2), {
		baseDir: BaseDirectory.AppConfig
	});
}, 500); // 500ms debounce delay

configStore.subscribe(debouncedWrite);
