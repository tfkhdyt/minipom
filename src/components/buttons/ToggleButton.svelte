<script lang="ts">
	import type { ButtonState, PomodoroType } from '@/types';
	import { cn } from '@/utils';
	import { match } from 'ts-pattern';

	export let handleClick: () => void;
	export let buttonState: ButtonState;
	export let pomodoroType: PomodoroType;
</script>

<div class="w-48 md:w-56 mx-auto pt-3">
	<div class="relative h-14 md:h-16 w-full bg-[#ebebeb] rounded-md">
		<button
			type="button"
			on:click={handleClick}
			class={cn(
				'w-full absolute flex h-full items-center justify-center gap-3 rounded-md border border-[#ebebeb] p-2 text-xl md:text-2xl transition-all duration-200 lg:cursor-pointer uppercase font-bold focus:outline-none',
				buttonState === 'paused'
					? 'left-0 -top-1.5 bg-slate-50'
					: '-left-0 -top-0 bg-slate-100',
				match(pomodoroType)
					.with('pomodoro', () => 'text-[#BA4949]')
					.with('short-break', () => 'text-[#38858a]')
					.with('long-break', () => 'text-[#397097]')
					.exhaustive()
			)}>{buttonState === 'paused' ? 'Start' : 'Pause'}</button>
	</div>
</div>
