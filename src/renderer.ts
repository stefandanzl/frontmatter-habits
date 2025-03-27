import {App, Notice} from 'obsidian'
import {PLUGIN_NAME} from './settings'
import {findStreak, getDayOfWeek, getDateId, createDateFromFormat, pathToId, removeAllChildNodes} from './utils'
import {HabitTrackerSettings} from './settings'
import {toggleHabit} from './fileops'

export class HabitRenderer {
    settings: HabitTrackerSettings
    app: App

    constructor(settings: HabitTrackerSettings, app: App) {
        this.settings = settings
        this.app = app
    }

    renderNoHabitsFoundMessage() {
        const message = this.settings.useDailyNotes ? `No habits found in daily notes under ${this.settings.dailyNotesBasePath}` : `No habits found under ${this.settings.path}`

        this.settings.rootElement?.createEl('div', {
            text: message,
        })
    }

    renderRoot(parent: HTMLElement | undefined) {
        if (typeof parent === 'undefined' || typeof this.settings.rootElement === 'undefined') {
            console.log('undefined')
            return
        }
        const rootElement = parent.createEl('div', {
            cls: 'habit-tracker',
        })

        rootElement.setAttribute('id', this.settings.rootElement.id)
        rootElement.addEventListener('click', (e) => {
            const target = e.target as HTMLDivElement
            if (target?.classList.contains('habit-tick')) {
                const habit = target.getAttribute('habit')
                const date = target.getAttribute('date')
                const isTicked = target.getAttribute('ticked')

                if (habit && date && isTicked) {
                    toggleHabit(this.app, habit, date, isTicked, this.settings, (path, entries) => this.renderHabit(path, entries))
                }
            }
        })

        return rootElement
    }

    renderHeader(parent: HTMLElement | undefined) {
        if (typeof parent === 'undefined') {
            console.log('undefined')
            return
        }
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
                cls: `habit-tracker__cell habit-tracker__cell--${getDayOfWeek(currentDate)}`,
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

        // In daily notes mode, the path is actually the habit name
        const name = this.settings.useDailyNotes
            ? path // For daily notes, use the path (which is the habit name) directly
            : path.split('/').pop()?.replace('.md', '') // For habit files, extract from path

        let row = parent.querySelector(`*[data-id="${pathToId(path)}"]`) as HTMLElement

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

        // Only create a link for regular habit mode, not for daily notes mode
        if (this.settings.useDailyNotes) {
            habitTitle.createEl('span', {
                text: name,
                cls: 'habit-name',
            })
        } else {
            const habitTitleLink = habitTitle.createEl('a', {
                text: name,
                cls: 'internal-link',
            })
            habitTitleLink.setAttribute('href', path)
            habitTitleLink.setAttribute('aria-label', path)
        }

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
