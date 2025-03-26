import {Notice} from 'obsidian'
import {PLUGIN_NAME} from './settings'
import {
	findStreak,
	getDayOfWeek,
	getDateId,
	createDateFromFormat,
	pathToId,
	removeAllChildNodes,
} from './utils'
import {HabitTrackerSettings} from './settings'
import {toggleHabit} from './fileops'

export class HabitRenderer {
	settings: HabitTrackerSettings
	app: any

	constructor(settings: HabitTrackerSettings, app: any) {
		this.settings = settings
		this.app = app
	}

	renderNoHabitsFoundMessage() {
		this.settings.rootElement?.createEl('div', {
			text: `No habits found under ${this.settings.path}`,
		})
	}

	renderRoot(parent: HTMLElement) {
		const rootElement = parent.createEl('div', {
			cls: 'habit-tracker',
		})

		//@ts-ignore
		rootElement.setAttribute('id', this.settings.rootElement.id)
		rootElement.addEventListener('click', (e) => {
			const target = e.target as HTMLDivElement
			if (target?.classList.contains('habit-tick')) {
				const habit = target.getAttribute('habit')
				const date = target.getAttribute('date')
				const isTicked = target.getAttribute('ticked')

				if (habit && date && isTicked) {
					toggleHabit(this.app, habit, date, isTicked, (path, entries) =>
						this.renderHabit(path, entries),
					)
				}
			}
		})

		return rootElement
	}

	renderHeader(parent: HTMLElement) {
		const header = parent.createEl('div', {
			cls: 'habit-tracker__header habit-tracker__row',
		})

		header.createEl('div', {
			text: '',
			cls: 'habit-tracker__cell--name habit-tracker__cell',
		})

		const currentDate = createDateFromFormat(this.settings.lastDisplayedDate)
		currentDate.setDate(currentDate.getDate() - this.settings.daysToLoad + 1)

		for (let i = 0; i < this.settings.daysToLoad; i++) {
			const day = currentDate.getDate().toString()
			header.createEl('div', {
				cls: `habit-tracker__cell habit-tracker__cell--${getDayOfWeek(
					currentDate,
				)}`,
				text: day,
				attr: {
					'data-date': getDateId(currentDate),
				},
			})
			currentDate.setDate(currentDate.getDate() + 1)
		}
	}

	renderHabit(path: string, entries: string[]) {
		if (!this.settings.habitsGoHere) {
			new Notice(`${PLUGIN_NAME}: missing div that holds all habits`)
			return null
		}
		const parent = this.settings.habitsGoHere

		const name = path.split('/').pop()?.replace('.md', '')

		let row = parent.querySelector(
			`*[data-id="${pathToId(path)}"]`,
		) as HTMLElement

		if (!row) {
			row = this.settings.habitsGoHere.createEl('div', {
				cls: 'habit-tracker__row',
			})
			row.setAttribute('data-id', pathToId(path))
		} else {
			removeAllChildNodes(row)
		}

		const habitTitle = row.createEl('div', {
			cls: 'habit-tracker__cell--name habit-tracker__cell',
		})

		const habitTitleLink = habitTitle.createEl('a', {
			text: name,
			cls: 'internal-link',
		})

		habitTitleLink.setAttribute('href', path)
		habitTitleLink.setAttribute('aria-label', path)

		const currentDate = createDateFromFormat(this.settings.lastDisplayedDate)
		currentDate.setDate(currentDate.getDate() - this.settings.daysToLoad + 1)

		const entriesSet = new Set(entries)

		for (let i = 0; i < this.settings.daysToLoad; i++) {
			const dateString = getDateId(currentDate)
			const isTicked = entriesSet.has(dateString)

			const habitCell = row.createEl('div', {
				cls: `habit-tracker__cell
                habit-tick habit-tick--${isTicked}
                habit-tracker__cell--${getDayOfWeek(currentDate)}`,
			})

			habitCell.setAttribute('ticked', isTicked.toString())
			habitCell.setAttribute('date', dateString)
			habitCell.setAttribute('habit', path)
			habitCell.setAttribute('streak', findStreak(entries, currentDate))

			currentDate.setDate(currentDate.getDate() + 1)
		}
	}

	renderDebugData() {
		this.settings.rootElement?.createEl('pre', {
			// get the json printed with indentation
			text: JSON.stringify(this.settings, null, 2),
		})
	}
}
