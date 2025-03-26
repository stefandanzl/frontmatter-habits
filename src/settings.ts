import { App, PluginSettingTab, Setting, Plugin } from 'obsidian';
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

export class HabitTrackerSettingTab extends PluginSettingTab {
    plugin: Plugin & { settings: HabitTrackerSettings, saveSettings: () => Promise<void> }

    constructor(app: App, plugin: Plugin & { settings: HabitTrackerSettings, saveSettings: () => Promise<void> }) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const {containerEl} = this
        containerEl.empty()

        containerEl.createEl('h2', {text: 'Habit Tracker Settings'})

        // Standard habit tracker settings
        new Setting(containerEl)
            .setName('Habits folder')
            .setDesc('The folder where your habit files are stored (Used when not using daily notes)')
            .addText((text) =>
                text
                    .setPlaceholder('Habits')
                    .setValue(this.plugin.settings.path)
                    .onChange(async (value) => {
                        this.plugin.settings.path = value
                        await this.plugin.saveSettings()
                    }),
            )

        new Setting(containerEl)
            .setName('Days to show')
            .setDesc('Number of days to display in the habit tracker')
            .addText((text) =>
                text
                    .setPlaceholder('21')
                    .setValue(String(this.plugin.settings.daysToShow))
                    .onChange(async (value) => {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue) && numValue > 0) {
                            this.plugin.settings.daysToShow = numValue
                            this.plugin.settings.daysToLoad = numValue + 1
                            await this.plugin.saveSettings()
                        }
                    }),
            )

        // Daily notes settings
        containerEl.createEl('h3', {text: 'Daily Notes Integration'})

        new Setting(containerEl)
            .setName('Use daily notes')
            .setDesc('Read habit data from daily notes instead of dedicated habit files')
            .addToggle((toggle) =>
                toggle.setValue(this.plugin.settings.useDailyNotes).onChange(async (value) => {
                    this.plugin.settings.useDailyNotes = value
                    await this.plugin.saveSettings()
                }),
            )

        new Setting(containerEl)
            .setName('Daily notes base path')
            .setDesc('The base folder where your daily notes are stored')
            .addText((text) =>
                text
                    .setPlaceholder('Journal')
                    .setValue(this.plugin.settings.dailyNotesBasePath)
                    .onChange(async (value) => {
                        this.plugin.settings.dailyNotesBasePath = value
                        await this.plugin.saveSettings()
                    }),
            )

        new Setting(containerEl)
            .setName('Daily notes format')
            .setDesc('The format of your daily notes paths using moment.js tokens (e.g., YYYY/YYYY-MM/YYYY-MM-DD ddd)')
            .addText((text) =>
                text
                    .setPlaceholder('YYYY/YYYY-MM/YYYY-MM-DD ddd')
                    .setValue(this.plugin.settings.dailyNotesFormat)
                    .onChange(async (value) => {
                        this.plugin.settings.dailyNotesFormat = value
                        await this.plugin.saveSettings()
                    }),
            )

        new Setting(containerEl)
            .setName('Habit frontmatter key')
            .setDesc('The key in the frontmatter that contains the habits data')
            .addText((text) =>
                text
                    .setPlaceholder('habits')
                    .setValue(this.plugin.settings.habitFrontmatterKey)
                    .onChange(async (value) => {
                        this.plugin.settings.habitFrontmatterKey = value
                        await this.plugin.saveSettings()
                    }),
            )

        // Debug settings
        containerEl.createEl('h3', {text: 'Debug Settings'})

        new Setting(containerEl)
            .setName('Debug mode')
            .setDesc('Enable debug information (0 = off, 1 = basic info, 2 = verbose)')
            .addText((text) =>
                text
                    .setPlaceholder('0')
                    .setValue(String(this.plugin.settings.debug))
                    .onChange(async (value) => {
                        const numValue = parseInt(value)
                        if (!isNaN(numValue) && numValue >= 0) {
                            this.plugin.settings.debug = numValue
                            await this.plugin.saveSettings()
                        }
                    }),
            )
    }
}
