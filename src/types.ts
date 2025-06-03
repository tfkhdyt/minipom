export type PomodoroType = 'pomodoro' | 'short-break' | 'long-break';
export type ButtonState = 'playing' | 'paused';

export type Config = {
	timer: {
		time: {
			pomodoro: number;
			shortBreak: number;
			longBreak: number;
		};
		autoStart: {
			breaks: boolean;
			pomodoros: boolean;
		};
		longBreakInterval: number;
	};
	task: {
		autoCheckTasks: boolean;
		autoSwitchTasks: boolean;
	};
};

export type Task = {
	id: number;
	title: string;
	note: string | null;
	done: boolean;
	act: number;
	est: number;
};

export type Data = {
	activeTask: number | null;
	reps: number;
	pomodoroState: PomodoroType;
	tasks: Task[];
	lastTime: number | undefined | null;
};
