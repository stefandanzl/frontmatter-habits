import {App, Notice} from 'obsidian'
import {HabitTrackerSettings, DEFAULT_SETTINGS, removePrivateSettings, PLUGIN_NAME} from './settings'
import {generateUniqueId} from './utils'
import {loadFiles, getHabitEntries, getDailyHabits, getHabitDatesForName} from './fileops'
import {HabitRenderer} from './renderer'

export default class HabitTracker {
    settings: HabitTrackerSettings
    app: App
    id: string
    renderer: HabitRenderer

    constructor(src: string, el: HTMLElement, ctx: any, app: App) {
        this.app = app
        this.id = generateUniqueId()
        this.settings = this.loadSettings(src)
        this.settings.rootElement = el
        this.renderer = new HabitRenderer(this.settings, this.app)

        // Initialize based on the mode (daily notes or habit files)
        this.initializeTracker()
    }

    async initializeTracker() {
        if (this.settings.useDailyNotes) {
            await this.initializeDailyNotesMode()
        } else {
            await this.initializeHabitFilesMode()
        }

        if (this.settings.debug) {
            this.renderer.renderDebugData()
        }
    }

    async initializeHabitFilesMode() {
        // 1. get all the habit files
        const files = loadFiles(this.app, this.settings)

        if (files.length === 0) {
            this.renderer.renderNoHabitsFoundMessage()
            return
        }

        console.log(`${PLUGIN_NAME} loaded successfully ${files.length} file(s) from ${this.settings.path}`)

        // 2.1 render the element that holds all habits
        this.settings.habitsGoHere = this.renderer.renderRoot(this.settings.rootElement)

        // 2.2 render the header
        this.renderer.renderHeader(this.settings.habitsGoHere)

        // 2.3 render each habit
        for (const file of files) {
            this.renderer.renderHabit(file.path, await getHabitEntries(this.app, file.path, this.settings))
        }
    }

    async initializeDailyNotesMode() {
        // 1. Get all unique habit names from daily notes
        const habitNames = await getDailyHabits(this.app, this.settings)

        if (habitNames.length === 0) {
            this.renderer.renderNoHabitsFoundMessage()
            return
        }

        console.log(`${PLUGIN_NAME} loaded successfully ${habitNames.length} habits from daily notes in ${this.settings.dailyNotesBasePath}`)

        // 2.1 render the element that holds all habits
        this.settings.habitsGoHere = this.renderer.renderRoot(this.settings.rootElement)

        // 2.2 render the header
        this.renderer.renderHeader(this.settings.habitsGoHere)

        // 2.3 render each habit
        for (const habitName of habitNames) {
            // Get all dates where this habit is checked
            const habitDates = await getHabitDatesForName(this.app, habitName, this.settings)

            // For daily notes mode, we use the habit name as the "path"
            this.renderer.renderHabit(habitName, habitDates)
        }
    }

    loadSettings(rawSettings: string): HabitTrackerSettings {
        try {
            let settings = Object.assign({}, DEFAULT_SETTINGS(), removePrivateSettings(JSON.parse(rawSettings)))
            /* i want to show that a streak is already ongoing even if the previous dates are not rendered
            so I load an extra date in the range, but never display it in the UI */
            settings.daysToLoad = settings.daysToShow + 1
            return settings
        } catch (error) {
            console.log(error)
            new Notice(`${PLUGIN_NAME}: received invalid settings. continuing with default settings`)
            return DEFAULT_SETTINGS()
        }
    }
}
