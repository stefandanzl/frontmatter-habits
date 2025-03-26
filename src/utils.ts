import {App, Notice, parseYaml, TAbstractFile, TFile} from 'obsidian'
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
