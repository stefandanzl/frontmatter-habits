import {App, Notice} from 'obsidian'
import {
	HabitTrackerSettings,
	DEFAULT_SETTINGS,
	removePrivateSettings,
	PLUGIN_NAME,
} from './settings'
import {generateUniqueId} from './utils'
import {loadFiles, getHabitEntries} from './fileops'
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

		//@ts-ignore
		this.settings.rootElement = el
		this.renderer = new HabitRenderer(this.settings, this.app)

		// 1. get all the habits
		const files = loadFiles(this.app, this.settings.path)

		if (files.length === 0) {
			this.renderer.renderNoHabitsFoundMessage()
			return
		}

		console.log(
			`${PLUGIN_NAME} loaded successfully ${files.length} file(s) from ${this.settings.path}`,
		)

		// 2.1 render the element that holds all habits
		this.settings.habitsGoHere = this.renderer.renderRoot(el)

		// 2.2 render the header
		this.renderer.renderHeader(this.settings.habitsGoHere)

		// 2.3 render each habit
		files.forEach(async (f) => {
			this.renderer.renderHabit(f.path, await getHabitEntries(this.app, f.path))
		})

		if (this.settings.debug) {
			this.renderer.renderDebugData()
		}
	}

	loadSettings(rawSettings: string): HabitTrackerSettings {
		try {
			let settings = Object.assign(
				{},
				DEFAULT_SETTINGS(),
				removePrivateSettings(JSON.parse(rawSettings)),
			)
			/* i want to show that a streak is already ongoing even if the previous dates are not rendered
            so I load an extra date in the range, but never display it in the UI */
			settings.daysToLoad = settings.daysToShow + 1
			return settings
		} catch (error) {
			console.log(error)
			new Notice(
				`${PLUGIN_NAME}: received invalid settings. continuing with default settings`,
			)
			return DEFAULT_SETTINGS()
		}
	}
}
