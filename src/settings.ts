import { getTodayDate } from './utils';

// Constants
export const PLUGIN_NAME = 'Habit Tracker 21';
/* i want to show that a streak is already ongoing even if the previous dates are not rendered
  so I load an extra date in the range, but never display it in the UI */
export const DAYS_TO_SHOW = 21;
export const DAYS_TO_LOAD = DAYS_TO_SHOW + 1;

export interface HabitTrackerSettings {
	path: string;
	lastDisplayedDate: string;
	daysToShow: number;
	daysToLoad: number;
	rootElement: HTMLElement | undefined;
	habitsGoHere: HTMLDivElement | undefined;
	debug: number;
    // Daily notes settings
    useDailyNotes: boolean;
    dailyNotesBasePath: string;
    dailyNotesFormat: string;
    habitFrontmatterKey: string;
}

export const DEFAULT_SETTINGS = (): HabitTrackerSettings => ({
	path: 'Habits',
	lastDisplayedDate: getTodayDate(),
	daysToShow: DAYS_TO_SHOW,
	daysToLoad: DAYS_TO_LOAD,
	rootElement: undefined,
	habitsGoHere: undefined,
	debug: 0,
    // Default daily notes settings
    useDailyNotes: false,
    dailyNotesBasePath: 'Journal',
    dailyNotesFormat: 'YYYY/YYYY-MM/YYYY-MM-DD ddd',
    habitFrontmatterKey: 'habits',
});

export const ALLOWED_USER_SETTINGS = [
    'path', 
    'lastDisplayedDate', 
    'daysToShow', 
    'debug',
    'useDailyNotes',
    'dailyNotesBasePath',
    'dailyNotesFormat',
    'habitFrontmatterKey'
];

export function removePrivateSettings(userSettings: any) {
    const result = {};
    ALLOWED_USER_SETTINGS.forEach((key) => {
        if (userSettings[key] !== undefined) {
            result[key] = userSettings[key];
        }
    });

    return result;
}
