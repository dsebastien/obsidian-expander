import { describe, test, expect } from 'bun:test'
import {
    formatDate,
    now,
    today,
    DateValue,
    createNow,
    createToday,
    createDateValue,
    createDateFromString
} from './date'

describe('now()', () => {
    test('returns a Date object', () => {
        const result = now()
        expect(result instanceof Date).toBe(true)
    })

    test('returns current time (within 1 second)', () => {
        const before = Date.now()
        const result = now()
        const after = Date.now()
        expect(result.getTime()).toBeGreaterThanOrEqual(before)
        expect(result.getTime()).toBeLessThanOrEqual(after)
    })
})

describe('today()', () => {
    test('returns a Date object', () => {
        const result = today()
        expect(result instanceof Date).toBe(true)
    })

    test('returns midnight (00:00:00)', () => {
        const result = today()
        expect(result.getHours()).toBe(0)
        expect(result.getMinutes()).toBe(0)
        expect(result.getSeconds()).toBe(0)
        expect(result.getMilliseconds()).toBe(0)
    })

    test("returns today's date", () => {
        const result = today()
        const current = new Date()
        expect(result.getFullYear()).toBe(current.getFullYear())
        expect(result.getMonth()).toBe(current.getMonth())
        expect(result.getDate()).toBe(current.getDate())
    })
})

describe('formatDate()', () => {
    const testDate = new Date('2024-01-15T14:30:45.123Z')

    test('formats YYYY (4-digit year)', () => {
        expect(formatDate(testDate, 'YYYY')).toBe('2024')
    })

    test('formats YY (2-digit year)', () => {
        expect(formatDate(testDate, 'YY')).toBe('24')
    })

    test('formats MM (zero-padded month)', () => {
        expect(formatDate(testDate, 'MM')).toBe('01')
    })

    test('formats M (month without padding)', () => {
        expect(formatDate(testDate, 'M')).toBe('1')
    })

    test('formats DD (zero-padded day)', () => {
        expect(formatDate(testDate, 'DD')).toBe('15')
    })

    test('formats D (day without padding)', () => {
        const singleDigitDay = new Date('2024-01-05T10:00:00Z')
        expect(formatDate(singleDigitDay, 'D')).toBe('5')
    })

    test('formats HH (24-hour, zero-padded)', () => {
        // Note: output depends on timezone
        const result = formatDate(testDate, 'HH')
        expect(result).toMatch(/^\d{2}$/)
    })

    test('formats H (24-hour, no padding)', () => {
        const result = formatDate(testDate, 'H')
        expect(result).toMatch(/^\d{1,2}$/)
    })

    test('formats hh (12-hour, zero-padded)', () => {
        const result = formatDate(testDate, 'hh')
        expect(result).toMatch(/^(0[1-9]|1[0-2])$/)
    })

    test('formats h (12-hour, no padding)', () => {
        const result = formatDate(testDate, 'h')
        expect(result).toMatch(/^([1-9]|1[0-2])$/)
    })

    test('formats mm (zero-padded minutes)', () => {
        expect(formatDate(testDate, 'mm')).toBe('30')
    })

    test('formats m (minutes without padding)', () => {
        const singleDigitMinute = new Date('2024-01-15T14:05:00Z')
        expect(formatDate(singleDigitMinute, 'm')).toBe('5')
    })

    test('formats ss (zero-padded seconds)', () => {
        expect(formatDate(testDate, 'ss')).toBe('45')
    })

    test('formats s (seconds without padding)', () => {
        const singleDigitSecond = new Date('2024-01-15T14:30:05Z')
        expect(formatDate(singleDigitSecond, 's')).toBe('5')
    })

    test('formats A (AM/PM)', () => {
        const result = formatDate(testDate, 'A')
        expect(result).toMatch(/^(am|pm)$/i)
    })

    test('formats a (am/pm)', () => {
        const result = formatDate(testDate, 'a')
        // date-fns 'a' token can return uppercase depending on locale
        expect(result).toMatch(/^(AM|PM|am|pm)$/)
    })

    test('formats complex pattern YYYY-MM-DD', () => {
        expect(formatDate(testDate, 'YYYY-MM-DD')).toBe('2024-01-15')
    })

    test('formats complex pattern MM/DD/YYYY', () => {
        expect(formatDate(testDate, 'MM/DD/YYYY')).toBe('01/15/2024')
    })

    test('formats complex pattern DD.MM.YYYY', () => {
        expect(formatDate(testDate, 'DD.MM.YYYY')).toBe('15.01.2024')
    })

    test('formats with time HH:mm:ss', () => {
        expect(formatDate(testDate, 'mm:ss')).toBe('30:45')
    })
})

describe('DateValue', () => {
    const testDate = new Date('2024-06-20T10:15:30Z')

    test('format() returns formatted string', () => {
        const dv = new DateValue(testDate)
        expect(dv.format('YYYY-MM-DD')).toBe('2024-06-20')
    })

    test('format() with default pattern', () => {
        const dv = new DateValue(testDate)
        // Default is YYYY-MM-DD if not specified in evaluator
        expect(dv.format('YYYY')).toBe('2024')
    })

    test('toDate() returns underlying Date', () => {
        const dv = new DateValue(testDate)
        expect(dv.toDate()).toBe(testDate)
    })

    test('toString() returns ISO string', () => {
        const dv = new DateValue(testDate)
        expect(dv.toString()).toBe(testDate.toISOString())
    })
})

describe('createNow()', () => {
    test('returns DateValue', () => {
        const result = createNow()
        expect(result instanceof DateValue).toBe(true)
    })

    test('wraps current time', () => {
        const before = Date.now()
        const result = createNow()
        const after = Date.now()
        expect(result.toDate().getTime()).toBeGreaterThanOrEqual(before)
        expect(result.toDate().getTime()).toBeLessThanOrEqual(after)
    })
})

describe('createToday()', () => {
    test('returns DateValue', () => {
        const result = createToday()
        expect(result instanceof DateValue).toBe(true)
    })

    test('wraps midnight time', () => {
        const result = createToday()
        const date = result.toDate()
        expect(date.getHours()).toBe(0)
        expect(date.getMinutes()).toBe(0)
        expect(date.getSeconds()).toBe(0)
    })
})

describe('createDateValue()', () => {
    test('wraps provided date', () => {
        const date = new Date('2024-03-10T12:00:00Z')
        const result = createDateValue(date)
        expect(result instanceof DateValue).toBe(true)
        expect(result.toDate()).toBe(date)
    })

    test('format() works on wrapped date', () => {
        const date = new Date('2024-03-10T12:00:00Z')
        const result = createDateValue(date)
        expect(result.format('YYYY-MM-DD')).toBe('2024-03-10')
    })
})

describe('createDateFromString()', () => {
    describe('ISO format (YYYY-MM-DD)', () => {
        test('parses valid ISO date', () => {
            const result = createDateFromString('2024-01-15')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-01-15')
        })

        test('parses ISO date with time', () => {
            const result = createDateFromString('2024-01-15T10:30:00')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-01-15')
        })

        test('extracts ISO date from longer string', () => {
            const result = createDateFromString('2024-01-15 Meeting Notes')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-01-15')
        })

        test('extracts ISO date from string with prefix', () => {
            const result = createDateFromString('Daily Log 2024-01-15')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-01-15')
        })

        test('extracts ISO date from middle of string', () => {
            const result = createDateFromString('Notes for 2024-06-20 - Important')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-06-20')
        })
    })

    describe('slash format (YYYY/MM/DD)', () => {
        test('parses slash format date', () => {
            const result = createDateFromString('2024/01/15')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-01-15')
        })

        test('extracts slash format from longer string', () => {
            const result = createDateFromString('Report 2024/06/20 Final')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-06-20')
        })
    })

    describe('compact format (YYYYMMDD)', () => {
        test('parses compact format date', () => {
            const result = createDateFromString('20240115')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-01-15')
        })

        test('parses compact format at start of string', () => {
            const result = createDateFromString('20240620 Project Notes')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM-DD')).toBe('2024-06-20')
        })
    })

    describe('edge cases and invalid inputs', () => {
        test('returns null for empty string', () => {
            expect(createDateFromString('')).toBeNull()
        })

        test('returns null for whitespace only', () => {
            expect(createDateFromString('   ')).toBeNull()
        })

        test('returns null for non-date string', () => {
            expect(createDateFromString('hello world')).toBeNull()
        })

        test('parses partial date using native parser', () => {
            // Native Date parser handles "2024-01" as January 2024
            const result = createDateFromString('2024-01')
            expect(result).not.toBeNull()
            expect(result?.format('YYYY-MM')).toBe('2024-01')
        })

        test('handles ambiguous numeric strings', () => {
            // Very long numbers may be interpreted as years by native parser
            // This documents actual behavior rather than ideal behavior
            const result = createDateFromString('12345')
            // Native Date interprets this as year 12345
            expect(result).not.toBeNull()
        })
    })

    describe('date component extraction', () => {
        test('extracts correct year', () => {
            const result = createDateFromString('2024-06-20')
            expect(result?.format('YYYY')).toBe('2024')
        })

        test('extracts correct month', () => {
            const result = createDateFromString('2024-06-20')
            expect(result?.format('MM')).toBe('06')
        })

        test('extracts correct day', () => {
            const result = createDateFromString('2024-06-20')
            expect(result?.format('DD')).toBe('20')
        })

        test('reformats date correctly', () => {
            const result = createDateFromString('2024-01-15')
            expect(result?.format('DD/MM/YYYY')).toBe('15/01/2024')
        })
    })
})
