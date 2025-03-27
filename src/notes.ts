import {App, TAbstractFile, TFile, Notice, moment} from 'obsidian'
import {PLUGIN_NAME} from './settings'

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
