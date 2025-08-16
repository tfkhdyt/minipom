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
	try {
		// Check if the AppConfig base directory exists
		const isConfigDirExists = await exists('.', {
			baseDir: BaseDirectory.AppConfig
		});

		console.log('isConfigDirExists', isConfigDirExists);

		if (!isConfigDirExists) {
			// Create the AppConfig directory if it doesn't exist
			await mkdir('.', { baseDir: BaseDirectory.AppConfig });
		}

		const isConfigFileExists = await exists('config.json', {
			baseDir: BaseDirectory.AppConfig
		});
		if (!isConfigFileExists) {
			console.log('config.json not found, creating default config');
			await writeTextFile(
				'config.json',
				JSON.stringify(defaultConfig, null, 2),
				{
					baseDir: BaseDirectory.AppConfig
				}
			);
			return defaultConfig;
		}

		const contents = await readTextFile('config.json', {
			baseDir: BaseDirectory.AppConfig
		});
		const currentConfig = JSON.parse(contents) as Config;
		return currentConfig;
	} catch (error) {
		console.error('Error in getConfig, using default config:', error);
		return defaultConfig;
	}
}

// Initialize with default config to prevent undefined values on first load
export const configStore = writable<Config>(defaultConfig);

const debouncedWrite = debounce(async (value: Config) => {
	console.log('debouncedWrite', value);
	await writeTextFile('config.json', JSON.stringify(value, null, 2), {
		baseDir: BaseDirectory.AppConfig
	});
}, 500); // 500ms debounce delay

configStore.subscribe(debouncedWrite);
