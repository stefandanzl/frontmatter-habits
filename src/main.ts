import {Plugin} from 'obsidian'
import HabitTracker from './tracker'
import {HabitTrackerSettings, DEFAULT_SETTINGS, HabitTrackerSettingTab} from './settings'

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


