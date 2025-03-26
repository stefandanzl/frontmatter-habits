import {App, Notice, parseYaml, TAbstractFile, TFile, moment} from 'obsidian'
import {PLUGIN_NAME, HabitTrackerSettings} from './settings'

export function loadFiles(app: App, settings: HabitTrackerSettings) {
    if (settings.useDailyNotes) {
        return loadDailyNotes(app, settings)
    } else {
        return loadHabitFiles(app, settings.path)
    }
}

function loadHabitFiles(app: App, settingsPath: string) {
    return app.vault
        .getMarkdownFiles()
        .filter((file) => {
            // only habits
            if (!file.path.includes(settingsPath)) {
                return false
            }
            return true
        })
        .sort((a, b) => a.name.localeCompare(b.name))
}

function loadDailyNotes(app: App, settings: HabitTrackerSettings) {
    // Get all markdown files
    const allFiles = app.vault.getMarkdownFiles()

    // Filter files that are in the daily notes folder
    const dailyNotes = allFiles.filter((file) => {
        return file.path.startsWith(settings.dailyNotesBasePath)
    })

    // Sort by date (most recent first)
    return dailyNotes.sort((a, b) => {
        // Attempt to extract dates from filenames if possible
        const dateA = extractDateFromPath(a.path, settings)
        const dateB = extractDateFromPath(b.path, settings)

        if (dateA && dateB) {
            return dateB.valueOf() - dateA.valueOf() // Descending order
        }

        // Fallback to name comparison
        return a.name.localeCompare(b.name)
    })
}

export function extractDateFromPath(path: string, settings: HabitTrackerSettings): moment.Moment | null {
    try {
        // If we have a basePath, remove it from the path
        let relativePath = path
        if (settings.dailyNotesBasePath && path.startsWith(settings.dailyNotesBasePath)) {
            relativePath = path.substring(settings.dailyNotesBasePath.length)

            // Remove leading slash if present
            if (relativePath.startsWith('/')) {
                relativePath = relativePath.substring(1)
            }
        }

        // Remove file extension
        if (relativePath.endsWith('.md')) {
            relativePath = relativePath.substring(0, relativePath.length - 3)
        }

        // Try to parse the path using the format
        const date = moment(relativePath, settings.dailyNotesFormat, true)

        if (date.isValid()) {
            return date
        }

        return null
    } catch (error) {
        console.error(`${PLUGIN_NAME}: Error extracting date from path: ${path}`, error)
        return null
    }
}

/**
 * Generate an array of daily note file paths for a range of days counting backwards from a given date
 * @param date The starting date
 * @param daysCount Number of days to include (including the start date)
 * @param settings The settings containing format and base path
 * @returns Array of file paths for each day
 */
export function getDailyNotePaths(date: Date, daysCount: number, settings: {dailyNotesFormat: string; dailyNotesBasePath: string}): string[] {
    const paths: string[] = []
    const currentDate = new Date(date)

    for (let i = 0; i < daysCount; i++) {
        // Create a moment object from the date
        const momentDate = moment(currentDate)

        // Format the path using the settings
        const formattedDate = momentDate.format(settings.dailyNotesFormat)
        const fullPath = `${settings.dailyNotesBasePath}/${formattedDate}.md`

        // Add to the array
        paths.push(fullPath)

        // Move to the previous day
        currentDate.setDate(currentDate.getDate() - 1)
    }
    return paths
}

export function formatDatePath(date: moment.Moment, settings: HabitTrackerSettings): string {
    try {
        const formattedDate = date.format(settings.dailyNotesFormat)
        return `${settings.dailyNotesBasePath}/${formattedDate}.md`
    } catch (error) {
        console.error(`${PLUGIN_NAME}: Error formatting date path`, error)
        return ''
    }
}

export async function getFrontmatter(app: App, path: string) {
    const file: TAbstractFile | null = app.vault.getAbstractFileByPath(path)

    if (!file || !(file instanceof TFile)) {
        new Notice(`${PLUGIN_NAME}: No file found for path: ${path}`)
        return {}
    }

    try {
        return await this.app.metadataCache.getFileCache(file)?.frontmatter
    } catch (error) {
        return {}
    }
}

export async function getHabitEntries(app: App, path: string, settings: HabitTrackerSettings) {
    const fm = await getFrontmatter(app, path)

    if (settings.useDailyNotes) {
        // For daily notes, look for the specific habit key
        if (fm && fm[settings.habitFrontmatterKey]) {
            const habitData = fm[settings.habitFrontmatterKey]

            // Parse the date from the file path
            const fileDate = extractDateFromPath(path, settings)
            if (!fileDate) return []

            const fileDateStr = fileDate.format('YYYY-MM-DD')

            // If the habit data is an array of strings (habit names)
            if (Array.isArray(habitData)) {
                return habitData
            }

            // If the habit data is an object with habit names as keys
            if (typeof habitData === 'object' && habitData !== null) {
                return Object.keys(habitData).filter((habitName) => {
                    const habitValue = habitData[habitName]
                    // If the value is a boolean, return true if it's true
                    if (typeof habitValue === 'boolean') {
                        return habitValue === true
                    }
                    // If the value is a string and equals 'true', 'yes', 'y', 'complete', etc.
                    if (typeof habitValue === 'string') {
                        const val = habitValue.toLowerCase()
                        return val === 'true' || val === 'yes' || val === 'y' || val === 'complete' || val === 'completed' || val === '1'
                    }
                    return false
                })
            }

            return []
        }

        return []
    } else {
        // For dedicated habit files, use the original behavior
        return fm.entries || []
    }
}

export async function getDailyHabits(app: App, settings: HabitTrackerSettings) {
    // Get all habit names from all daily notes
    const dailyNotes = loadDailyNotes(app, settings)
    const habitNames = new Set<string>()

    for (const file of dailyNotes) {
        const fm = await getFrontmatter(app, file.path)
        if (fm && fm[settings.habitFrontmatterKey]) {
            const habitData = fm[settings.habitFrontmatterKey]

            // If it's an array, add all items
            if (Array.isArray(habitData)) {
                habitData.forEach((habit) => habitNames.add(habit))
            }
            // If it's an object, add all keys
            else if (typeof habitData === 'object' && habitData !== null) {
                Object.keys(habitData).forEach((habit) => habitNames.add(habit))
            }
        }
    }

    return Array.from(habitNames).sort()
}

export async function toggleHabitInDailyNote(app: App, habitName: string, date: string, isTicked: string, settings: HabitTrackerSettings, renderHabitCallback: (habitName: string, dates: string[]) => void) {
    // Convert date string to moment object
    const momentDate = moment(date, 'YYYY-MM-DD')

    // Format the path to the daily note
    const notePath = formatDatePath(momentDate, settings)

    // Get the file
    const file: TAbstractFile | null = app.vault.getAbstractFileByPath(notePath)

    if (!file || !(file instanceof TFile)) {
        new Notice(`${PLUGIN_NAME}: Daily note not found for date: ${date}`)
        return
    }

    app.fileManager.processFrontMatter(file, (frontmatter) => {
        // Initialize habits object if it doesn't exist
        if (!frontmatter[settings.habitFrontmatterKey]) {
            frontmatter[settings.habitFrontmatterKey] = {}
        }

        // If the habits property is an array, convert to object
        if (Array.isArray(frontmatter[settings.habitFrontmatterKey])) {
            const habitsArray = frontmatter[settings.habitFrontmatterKey]
            const habitsObject = {}

            // Convert from array to object
            habitsArray.forEach((habit) => {
                habitsObject[habit] = true
            })

            frontmatter[settings.habitFrontmatterKey] = habitsObject
        }

        // Now it should be an object
        const habits = frontmatter[settings.habitFrontmatterKey]

        // Toggle the habit
        if (isTicked === 'true') {
            habits[habitName] = false
        } else {
            habits[habitName] = true
        }

        // If all habits are false, clean up by removing empty habits
        const allFalse = Object.values(habits).every((val) => val === false)
        if (allFalse) {
            frontmatter[settings.habitFrontmatterKey] = {}
        }
    })

    // Get all dates where this habit is completed
    const habitDates = await getHabitDatesForName(app, habitName, settings)

    // Update the UI
    renderHabitCallback(habitName, habitDates)
}

export async function getHabitDatesForName(app: App, habitName: string, settings: HabitTrackerSettings): Promise<string[]> {
    const dailyNotes = loadDailyNotes(app, settings)
    const dates: string[] = []

    for (const file of dailyNotes) {
        const fm = await getFrontmatter(app, file.path)
        if (fm && fm[settings.habitFrontmatterKey]) {
            const habitData = fm[settings.habitFrontmatterKey]

            // Extract the date from file path
            const fileDate = extractDateFromPath(file.path, settings)
            if (!fileDate) continue

            const fileDateStr = fileDate.format('YYYY-MM-DD')

            // Check if the habit is completed based on data format
            let isCompleted = false

            // If it's an array, check if the habit name is in it
            if (Array.isArray(habitData)) {
                isCompleted = habitData.includes(habitName)
            }
            // If it's an object, check if the key exists and is true
            else if (typeof habitData === 'object' && habitData !== null) {
                const value = habitData[habitName]
                if (typeof value === 'boolean') {
                    isCompleted = value
                } else if (typeof value === 'string') {
                    const val = value.toLowerCase()
                    isCompleted = val === 'true' || val === 'yes' || val === 'y' || val === 'complete' || val === 'completed' || val === '1'
                }
            }

            if (isCompleted) {
                dates.push(fileDateStr)
            }
        }
    }

    return dates.sort()
}

export async function toggleHabit(app: App, habit: string, date: string, isTicked: string, settings: HabitTrackerSettings, renderHabitCallback: (path: string, entries: string[]) => void) {
    if (settings.useDailyNotes) {
        await toggleHabitInDailyNote(app, habit, date, isTicked, settings, renderHabitCallback)
    } else {
        // Original habit file behavior
        const file: TAbstractFile | null = app.vault.getAbstractFileByPath(habit)

        if (!file || !(file instanceof TFile)) {
            new Notice(`${PLUGIN_NAME}: file missing while trying to toggle habit`)
            return
        }

        app.fileManager.processFrontMatter(file, (frontmatter) => {
            let entries = frontmatter['entries'] || []
            if (isTicked === 'true') {
                entries = entries.filter((e: string) => e !== date)
            } else {
                entries.push(date)
                entries.sort()
            }
            frontmatter['entries'] = entries
        })

        const updatedEntries = await getHabitEntries(app, file.path, settings)
        renderHabitCallback(file.path, updatedEntries)
    }
}
