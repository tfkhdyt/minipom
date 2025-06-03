<script lang="ts">
	import * as Tooltip from '@/components/ui/tooltip';
	import { dataStore } from '@/stores/data.store';
	import { type ButtonState } from '@/types';
	import { cn } from '@/utils';
	import { match } from 'ts-pattern';
	import SkipButton from './buttons/SkipButton.svelte';
	import ToggleButton from './buttons/ToggleButton.svelte';
	import SettingDialog from './SettingDialog.svelte';

	export let timer: string;
	export let handleClick: () => void;
	export let buttonState: ButtonState;
	export let nextStep: () => Promise<void>;
	export let elapsedTimer: string;
</script>

<div
	style="-webkit-backdrop-filter: blur(4px); backdrop-filter: blur(4px);"
	class={cn(
		'w-[450px] md:w-[500px] mx-auto py-8 md:py-10 rounded-xl space-y-4 md:space-y-6 transition duration-500',
		'border border-white/20 shadow-xl',
		match($dataStore.pomodoroState)
			.with('pomodoro', () => 'bg-[#c15c5c]/70')
			.with('short-break', () => 'bg-[#4c9196]/70')
			.with('long-break', () => 'bg-[#4d7fa2]/70')
			.exhaustive()
	)}>
	<h1 class="mx-auto font-bold text-2xl md:text-3xl select-none cursor-default">
		{match($dataStore.pomodoroState)
			.with('pomodoro', () => 'Pomodoro')
			.with('short-break', () => 'Short Break')
			.with('long-break', () => 'Long Break')
			.exhaustive()}
	</h1>
	<h2
		class="font-bold font-rounded text-8xl md:text-9xl tracking-wide select-none cursor-default text-center mx-auto">
		{timer}
	</h2>

	{#if buttonState === 'paused'}
		<div
			class="text-center text-white/70 text-sm md:text-base select-none cursor-default">
			Elapsed: {elapsedTimer}
		</div>
	{/if}

	<div class="relative flex items-center justify-center gap-8 w-fit mx-auto">
		<div class="w-8 h-12 flex items-center justify-center mt-2">
			<SettingDialog />
		</div>

		<ToggleButton
			{buttonState}
			{handleClick}
			pomodoroType={$dataStore.pomodoroState} />

		<div class="w-8 h-12 flex items-center justify-center mt-2">
			<div
				class={cn(
					'focus:outline-none transition-opacity duration-300 ease-in-out',
					buttonState !== 'playing'
						? 'opacity-0 pointer-events-none'
						: 'opacity-100'
				)}>
				<Tooltip.Root>
					<Tooltip.Trigger><SkipButton {nextStep} /></Tooltip.Trigger>
					<Tooltip.Content
						align="center"
						side="top"
						avoidCollisions={false}
						sideOffset={12}>
						<p>Skip</p>
					</Tooltip.Content>
				</Tooltip.Root>
			</div>
		</div>
	</div>
</div>
