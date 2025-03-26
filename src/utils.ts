import {App, Notice, parseYaml, TAbstractFile, TFile, moment, TFolder} from 'obsidian'
import {PLUGIN_NAME} from './settings'

export function getTodayDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export function getDaysDifference(startDateId: string, endDateId: string) {
    const start = new Date(startDateId)
    const end = new Date(endDateId)
    const oneDay = 24 * 60 * 60 * 1000 // hours * minutes * seconds * milliseconds

    const diffInTime = Math.abs(end.getTime() - start.getTime())
    const diffInDays = Math.round(diffInTime / oneDay)

    return diffInDays
}

export function createDateFromFormat(dateString: string) {
    const [year, month, day] = dateString.split('-').map(Number)
    const date = new Date()

    date.setFullYear(year)
    date.setMonth(month - 1)
    date.setDate(day)

    return date
}

export function getDateId(date: Date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

export function getDayOfWeek(date: Date) {
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const dayIndex = date.getDay()
    const dayName = daysOfWeek[dayIndex]
    return dayName.toLowerCase()
}

export function generateUniqueId() {
    const timestamp = Date.now()
    const randomNum = Math.floor(Math.random() * 10000) // Adjust the range as needed
    return `habittracker-${timestamp}-${randomNum}`
}

export function pathToId(path: string) {
    return path.replace(/\//g, '_').replace(/\./g, '__').replace(/ /g, '___')
}

export function removeAllChildNodes(parent: HTMLElement) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild)
    }
}

// Find streak
// based on an array of dates, get the current streak for the given date
export function findStreak(entries: string[], date: Date) {
    let currentDate = new Date(date)
    let streak = 0

    while (entries.includes(getDateId(currentDate))) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
    }

    return streak.toString()
}

/**
 * Parse a date from the current active file's filename using the moment.js format.
 * Handles full path format strings like "YYYY/YYYY-MM/YYYY-MM-DD dd" and extracts
 * just the filename part for parsing.
 * 
 * @param app - The Obsidian app instance
 * @param pathFormat - A full path format string that includes the filename format at the end
 * @returns The parsed date as a moment object or null if parsing failed
 */
export function parseDateFromFilename(app: App, pathFormat: string = 'YYYY-MM-DD') {
    const activeFile = app.workspace.getActiveFile();
    
    if (!activeFile) {
        new Notice(`${PLUGIN_NAME}: No file is currently open`);
        return null;
    }
    
    const filename = activeFile.basename;
    
    try {
        // Extract the filename format from the path format
        // This gets the last part of the path after the last '/' character
        const formatParts = pathFormat.split('/');
        const filenameFormat = formatParts[formatParts.length - 1];
        
        // Try to parse the filename using the extracted format
        const date = moment(filename, filenameFormat, true); // strict parsing
        
        if (date.isValid()) {
            return date;
        } else {
            new Notice(`${PLUGIN_NAME}: Could not parse date from filename "${filename}" using format "${filenameFormat}"`);
            return null;
        }
    } catch (error) {
        new Notice(`${PLUGIN_NAME}: Error parsing date: ${error.message}`);
        return null;
    }
}
