import { format as dateFnsFormat, startOfDay } from 'date-fns'

/**
 * Format token mapping from moment.js/custom tokens to date-fns tokens
 * This provides compatibility with common date format patterns
 */
const TOKEN_MAP: Record<string, string> = {
    // Year
    YYYY: 'yyyy',
    YY: 'yy',
    // Month
    MM: 'MM',
    M: 'M',
    // Day
    DD: 'dd',
    D: 'd',
    // Hours (24-hour)
    HH: 'HH',
    H: 'H',
    // Hours (12-hour)
    hh: 'hh',
    h: 'h',
    // Minutes
    mm: 'mm',
    m: 'm',
    // Seconds
    ss: 'ss',
    s: 's',
    // AM/PM
    A: 'a',
    a: 'a'
}

/**
 * Convert a moment.js-style format pattern to date-fns format pattern
 */
function convertFormatPattern(pattern: string): string {
    let result = pattern

    // Sort tokens by length (longest first) to avoid partial replacements
    const tokens = Object.keys(TOKEN_MAP).sort((a, b) => b.length - a.length)

    for (const token of tokens) {
        const replacement = TOKEN_MAP[token]
        if (replacement) {
            result = result.replace(new RegExp(token, 'g'), replacement)
        }
    }

    return result
}

/**
 * Format a date using a moment.js-compatible pattern
 * Internally converts to date-fns format for processing
 *
 * @param date - The date to format
 * @param pattern - Format pattern (moment.js style: YYYY-MM-DD, etc.)
 * @returns Formatted date string
 */
export function formatDate(date: Date, pattern: string): string {
    const dateFnsPattern = convertFormatPattern(pattern)
    return dateFnsFormat(date, dateFnsPattern)
}

/**
 * Get the current date and time
 */
export function now(): Date {
    return new Date()
}

/**
 * Get today's date at midnight (start of day)
 */
export function today(): Date {
    return startOfDay(new Date())
}

/**
 * Date wrapper class for chaining operations
 * Provides a fluent API for date manipulation and formatting
 */
export class DateValue {
    constructor(private date: Date) {}

    /**
     * Format the date using a moment.js-compatible pattern
     * Supported patterns: YYYY, YY, MM, M, DD, D, HH, H, hh, h, mm, m, ss, s, A, a
     */
    format(pattern: string): string {
        return formatDate(this.date, pattern)
    }

    /**
     * Get the underlying Date object
     */
    toDate(): Date {
        return this.date
    }

    /**
     * Get the ISO string representation
     */
    toString(): string {
        return this.date.toISOString()
    }
}

/**
 * Create a DateValue from the current date and time
 */
export function createNow(): DateValue {
    return new DateValue(now())
}

/**
 * Create a DateValue from today's date at midnight
 */
export function createToday(): DateValue {
    return new DateValue(today())
}
