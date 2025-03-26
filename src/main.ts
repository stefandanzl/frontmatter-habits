import {App, PluginSettingTab, Plugin, Setting} from 'obsidian'
import HabitTracker from './tracker'
import {HabitTrackerSettings, DEFAULT_SETTINGS} from './settings'

const PLUGIN_NAME = 'Frontmatter Habits'

export default class HabitTrackerPlugin extends Plugin {
    settings: HabitTrackerSettings

    async onload() {
        console.log(`${PLUGIN_NAME}: loading...`)

        // Load settings
        await this.loadSettings()

        // Register settings tab
        this.addSettingTab(new HabitTrackerSettingTab(this.app, this))

        // Register markdown code block processor
        this.registerMarkdownCodeBlockProcessor('habittracker', async (src, el, ctx) => {
            new HabitTracker(src, el, ctx, this.app)
        })
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS(), await this.loadData())
    }

    async saveSettings() {
        await this.saveData(this.settings)
    }
}

class HabitTrackerSettingTab extends PluginSettingTab {
    plugin: HabitTrackerPlugin

    constructor(app: App, plugin: HabitTrackerPlugin) {
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
