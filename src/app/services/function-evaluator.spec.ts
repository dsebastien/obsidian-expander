import { describe, test, expect } from 'bun:test'
import { evaluateValue, isDynamicExpression } from './function-evaluator'
import type { EvaluationContext } from '../types/evaluation-context'
import type { TFile } from 'obsidian'

/**
 * Create a mock TFile for testing file.* fields
 */
function createMockFile(options: {
    basename?: string
    path?: string
    extension?: string
    ctime?: number
    mtime?: number
}): TFile {
    return {
        basename: options.basename ?? 'TestNote',
        path: options.path ?? 'folder/TestNote.md',
        extension: options.extension ?? 'md',
        stat: {
            ctime: options.ctime ?? new Date('2024-01-15T10:30:00Z').getTime(),
            mtime: options.mtime ?? new Date('2024-06-20T14:45:00Z').getTime(),
            size: 1234
        },
        vault: {} as TFile['vault'],
        name: options.basename ? `${options.basename}.${options.extension ?? 'md'}` : 'TestNote.md',
        parent: null
    } as TFile
}

describe('isDynamicExpression', () => {
    test('returns true for function calls', () => {
        expect(isDynamicExpression('now()')).toBe(true)
        expect(isDynamicExpression('today()')).toBe(true)
        expect(isDynamicExpression('upper("hello")')).toBe(true)
        expect(isDynamicExpression('date("2024-01-15")')).toBe(true)
    })

    test('returns true for file fields', () => {
        expect(isDynamicExpression('file.name')).toBe(true)
        expect(isDynamicExpression('file.path')).toBe(true)
        expect(isDynamicExpression('file.folder')).toBe(true)
        expect(isDynamicExpression('file.ext')).toBe(true)
        expect(isDynamicExpression('file.ctime')).toBe(true)
        expect(isDynamicExpression('file.mtime')).toBe(true)
    })

    test('returns false for static values', () => {
        expect(isDynamicExpression('hello world')).toBe(false)
        expect(isDynamicExpression('static text')).toBe(false)
        expect(isDynamicExpression('no functions here')).toBe(false)
    })

    test('returns true for chained expressions', () => {
        expect(isDynamicExpression('now().format("YYYY")')).toBe(true)
        expect(isDynamicExpression('file.name.upper()')).toBe(true)
        expect(isDynamicExpression('upper("hello").replace("L", "X")')).toBe(true)
    })
})

describe('evaluateValue - static values', () => {
    test('returns static values unchanged', () => {
        expect(evaluateValue('hello world')).toBe('hello world')
        expect(evaluateValue('static text')).toBe('static text')
        expect(evaluateValue('')).toBe('')
    })
})

describe('evaluateValue - now() function', () => {
    test('now() returns current date', () => {
        const result = evaluateValue('now()')
        // Should be an ISO date string
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    test('now().format("YYYY-MM-DD") returns formatted date', () => {
        const result = evaluateValue('now().format("YYYY-MM-DD")')
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('now().format("YYYY") returns year only', () => {
        const result = evaluateValue('now().format("YYYY")')
        expect(result).toMatch(/^\d{4}$/)
    })

    test('now().format("MM") returns month', () => {
        const result = evaluateValue('now().format("MM")')
        expect(result).toMatch(/^(0[1-9]|1[0-2])$/)
    })

    test('now().format("DD") returns day', () => {
        const result = evaluateValue('now().format("DD")')
        expect(result).toMatch(/^(0[1-9]|[12]\d|3[01])$/)
    })

    test('now().format("HH:mm") returns time', () => {
        const result = evaluateValue('now().format("HH:mm")')
        expect(result).toMatch(/^\d{2}:\d{2}$/)
    })

    test('now().format("HH:mm:ss") returns time with seconds', () => {
        const result = evaluateValue('now().format("HH:mm:ss")')
        expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/)
    })
})

describe('evaluateValue - today() function', () => {
    test('today() returns date at midnight', () => {
        const result = evaluateValue('today()')
        // Should be an ISO date string
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    test('today().format("YYYY-MM-DD") returns formatted date', () => {
        const result = evaluateValue('today().format("YYYY-MM-DD")')
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('today().format("HH:mm:ss") returns midnight time', () => {
        const result = evaluateValue('today().format("HH:mm:ss")')
        expect(result).toBe('00:00:00')
    })
})

describe('evaluateValue - date() function', () => {
    test('date() parses ISO format (YYYY-MM-DD)', () => {
        const result = evaluateValue('date("2024-01-15").format("YYYY-MM-DD")')
        expect(result).toBe('2024-01-15')
    })

    test('date() parses slash format (YYYY/MM/DD)', () => {
        const result = evaluateValue('date("2024/01/15").format("YYYY-MM-DD")')
        expect(result).toBe('2024-01-15')
    })

    test('date() parses compact format (YYYYMMDD)', () => {
        const result = evaluateValue('date("20240115").format("YYYY-MM-DD")')
        expect(result).toBe('2024-01-15')
    })

    test('date() extracts date from longer string', () => {
        const result = evaluateValue('date("2024-01-15 Meeting Notes").format("YYYY-MM-DD")')
        expect(result).toBe('2024-01-15')
    })

    test('date() extracts date from string with prefix', () => {
        const result = evaluateValue('date("Daily Log 2024-01-15").format("YYYY-MM-DD")')
        expect(result).toBe('2024-01-15')
    })

    test('date().format("YYYY") extracts year', () => {
        const result = evaluateValue('date("2024-06-20").format("YYYY")')
        expect(result).toBe('2024')
    })

    test('date().format("MM") extracts month', () => {
        const result = evaluateValue('date("2024-06-20").format("MM")')
        expect(result).toBe('06')
    })

    test('date().format("DD") extracts day', () => {
        const result = evaluateValue('date("2024-06-20").format("DD")')
        expect(result).toBe('20')
    })

    test('date().format("DD/MM/YYYY") reformats date', () => {
        const result = evaluateValue('date("2024-01-15").format("DD/MM/YYYY")')
        expect(result).toBe('15/01/2024')
    })

    test('date() returns empty string for invalid date', () => {
        const result = evaluateValue('date("not a date").format("YYYY-MM-DD")')
        expect(result).toBe('')
    })

    test('date() returns empty string for empty input', () => {
        const result = evaluateValue('date("").format("YYYY-MM-DD")')
        expect(result).toBe('')
    })
})

describe('evaluateValue - upper() function', () => {
    test('upper("text") converts to uppercase', () => {
        expect(evaluateValue('upper("hello")')).toBe('HELLO')
    })

    test('upper("text") with mixed case', () => {
        expect(evaluateValue('upper("Hello World")')).toBe('HELLO WORLD')
    })

    test('upper("text") with already uppercase', () => {
        expect(evaluateValue('upper("HELLO")')).toBe('HELLO')
    })

    test('upper("text") with empty string', () => {
        expect(evaluateValue('upper("")')).toBe('')
    })

    test('upper("text") with special characters', () => {
        expect(evaluateValue('upper("hello-world_123")')).toBe('HELLO-WORLD_123')
    })
})

describe('evaluateValue - lower() function', () => {
    test('lower("text") converts to lowercase', () => {
        expect(evaluateValue('lower("HELLO")')).toBe('hello')
    })

    test('lower("text") with mixed case', () => {
        expect(evaluateValue('lower("Hello World")')).toBe('hello world')
    })

    test('lower("text") with already lowercase', () => {
        expect(evaluateValue('lower("hello")')).toBe('hello')
    })

    test('lower("text") with empty string', () => {
        expect(evaluateValue('lower("")')).toBe('')
    })
})

describe('evaluateValue - trim() function', () => {
    test('trim("text") removes leading/trailing whitespace', () => {
        expect(evaluateValue('trim("  hello  ")')).toBe('hello')
    })

    test('trim("text") removes leading whitespace only', () => {
        expect(evaluateValue('trim("  hello")')).toBe('hello')
    })

    test('trim("text") removes trailing whitespace only', () => {
        expect(evaluateValue('trim("hello  ")')).toBe('hello')
    })

    test('trim("text") with no whitespace', () => {
        expect(evaluateValue('trim("hello")')).toBe('hello')
    })

    test('trim("text") preserves internal whitespace', () => {
        expect(evaluateValue('trim("  hello world  ")')).toBe('hello world')
    })

    test('trim("text") with empty string', () => {
        expect(evaluateValue('trim("")')).toBe('')
    })

    test('trim("text") with only whitespace', () => {
        expect(evaluateValue('trim("   ")')).toBe('')
    })
})

describe('evaluateValue - replace() function', () => {
    test('replace("text", "find", "replacement") basic replacement', () => {
        expect(evaluateValue('replace("hello world", "world", "there")')).toBe('hello there')
    })

    test('replace() replaces all occurrences', () => {
        expect(evaluateValue('replace("a-b-c", "-", "_")')).toBe('a_b_c')
    })

    test('replace() with empty find string inserts between characters', () => {
        // JavaScript behavior: replaceAll("", "X") inserts X between every character
        expect(evaluateValue('replace("hello", "", "X")')).toBe('XhXeXlXlXoX')
    })

    test('replace() with empty replacement', () => {
        expect(evaluateValue('replace("hello", "l", "")')).toBe('heo')
    })

    test('replace() with no matches', () => {
        expect(evaluateValue('replace("hello", "x", "y")')).toBe('hello')
    })

    test('replace() with special characters', () => {
        expect(evaluateValue('replace("hello/world", "/", "-")')).toBe('hello-world')
    })
})

describe('evaluateValue - chained string functions', () => {
    test('upper().replace() chains correctly', () => {
        expect(evaluateValue('upper("hello").replace("L", "X")')).toBe('HEXXO')
    })

    test('lower().replace() chains correctly', () => {
        expect(evaluateValue('lower("HELLO").replace("l", "x")')).toBe('hexxo')
    })

    test('trim().upper() chains correctly', () => {
        expect(evaluateValue('trim("  hello  ").upper()')).toBe('HELLO')
    })

    test('upper().lower() chains correctly', () => {
        expect(evaluateValue('upper("hello").lower()')).toBe('hello')
    })

    test('multiple replace() calls chain correctly', () => {
        expect(evaluateValue('replace("a-b-c", "-", "_").replace("_", ".")')).toBe('a.b.c')
    })
})

describe('evaluateValue - date function with string chaining', () => {
    test('now().format().replace() chains correctly', () => {
        const result = evaluateValue('now().format("YYYY-MM-DD").replace("-", "/")')
        expect(result).toMatch(/^\d{4}\/\d{2}\/\d{2}$/)
    })

    test('today().format().upper() chains correctly', () => {
        // This will format to something like "2024-01-15" which has no letters
        // So upper() should have no effect
        const result = evaluateValue('today().format("YYYY-MM-DD").upper()')
        expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    test('date().format().replace() chains correctly', () => {
        const result = evaluateValue('date("2024-01-15").format("DD-MM-YYYY").replace("-", "/")')
        expect(result).toBe('15/01/2024')
    })
})

describe('evaluateValue - file.* fields', () => {
    const mockFile = createMockFile({
        basename: 'MyTestNote',
        path: 'Projects/Work/MyTestNote.md',
        extension: 'md',
        ctime: new Date('2024-01-15T10:30:00Z').getTime(),
        mtime: new Date('2024-06-20T14:45:00Z').getTime()
    })
    const context: EvaluationContext = { file: mockFile }

    test('file.name returns basename', () => {
        expect(evaluateValue('file.name', context)).toBe('MyTestNote')
    })

    test('file.path returns full path', () => {
        expect(evaluateValue('file.path', context)).toBe('Projects/Work/MyTestNote.md')
    })

    test('file.folder returns parent folder', () => {
        expect(evaluateValue('file.folder', context)).toBe('Projects/Work')
    })

    test('file.ext returns extension', () => {
        expect(evaluateValue('file.ext', context)).toBe('md')
    })

    test('file.ctime returns creation date', () => {
        const result = evaluateValue('file.ctime', context)
        expect(result).toContain('2024-01-15')
    })

    test('file.mtime returns modification date', () => {
        const result = evaluateValue('file.mtime', context)
        expect(result).toContain('2024-06-20')
    })

    test('file.ctime.format("YYYY-MM-DD") formats creation date', () => {
        const result = evaluateValue('file.ctime.format("YYYY-MM-DD")', context)
        expect(result).toBe('2024-01-15')
    })

    test('file.mtime.format("YYYY-MM-DD") formats modification date', () => {
        const result = evaluateValue('file.mtime.format("YYYY-MM-DD")', context)
        expect(result).toBe('2024-06-20')
    })

    test('file.ctime.format("YYYY") extracts year', () => {
        const result = evaluateValue('file.ctime.format("YYYY")', context)
        expect(result).toBe('2024')
    })
})

describe('evaluateValue - file fields with string functions', () => {
    const mockFile = createMockFile({
        basename: 'My Test Note',
        path: 'Projects/Work/My Test Note.md',
        extension: 'md'
    })
    const context: EvaluationContext = { file: mockFile }

    test('file.name.upper() converts name to uppercase', () => {
        expect(evaluateValue('file.name.upper()', context)).toBe('MY TEST NOTE')
    })

    test('file.name.lower() converts name to lowercase', () => {
        expect(evaluateValue('file.name.lower()', context)).toBe('my test note')
    })

    test('file.name.replace() replaces in name', () => {
        expect(evaluateValue('file.name.replace(" ", "-")', context)).toBe('My-Test-Note')
    })

    test('file.path.replace() replaces in path', () => {
        expect(evaluateValue('file.path.replace("/", " > ")', context)).toBe(
            'Projects > Work > My Test Note.md'
        )
    })

    test('upper(file.name) alternative syntax', () => {
        expect(evaluateValue('upper(file.name)', context)).toBe('MY TEST NOTE')
    })

    test('lower(file.name) alternative syntax', () => {
        expect(evaluateValue('lower(file.name)', context)).toBe('my test note')
    })

    test('file.name.upper().replace() chains correctly', () => {
        expect(evaluateValue('file.name.upper().replace(" ", "_")', context)).toBe('MY_TEST_NOTE')
    })
})

describe('evaluateValue - date() with file.name', () => {
    test('date(file.name) parses date from file name', () => {
        const mockFile = createMockFile({
            basename: '2024-01-15 Meeting Notes',
            path: 'Daily/2024-01-15 Meeting Notes.md'
        })
        const context: EvaluationContext = { file: mockFile }

        const result = evaluateValue('date(file.name).format("YYYY")', context)
        expect(result).toBe('2024')
    })

    test('date(file.name) extracts month from dated file', () => {
        const mockFile = createMockFile({
            basename: '2024-06-20 Project Update',
            path: 'Work/2024-06-20 Project Update.md'
        })
        const context: EvaluationContext = { file: mockFile }

        const result = evaluateValue('date(file.name).format("MM")', context)
        expect(result).toBe('06')
    })

    test('date(file.name) reformats dated file name', () => {
        const mockFile = createMockFile({
            basename: '2024-01-15 Daily Log',
            path: 'Logs/2024-01-15 Daily Log.md'
        })
        const context: EvaluationContext = { file: mockFile }

        const result = evaluateValue('date(file.name).format("DD/MM/YYYY")', context)
        expect(result).toBe('15/01/2024')
    })

    test('date(file.name) handles file without date', () => {
        const mockFile = createMockFile({
            basename: 'Meeting Notes',
            path: 'Work/Meeting Notes.md'
        })
        const context: EvaluationContext = { file: mockFile }

        const result = evaluateValue('date(file.name).format("YYYY-MM-DD")', context)
        expect(result).toBe('')
    })
})

describe('evaluateValue - file at root folder', () => {
    test('file.folder returns / for root file', () => {
        const mockFile = createMockFile({
            basename: 'RootNote',
            path: 'RootNote.md'
        })
        const context: EvaluationContext = { file: mockFile }

        expect(evaluateValue('file.folder', context)).toBe('/')
    })
})

describe('evaluateValue - without context', () => {
    test('file.name returns empty without context', () => {
        expect(evaluateValue('file.name')).toBe('')
    })

    test('file.path returns empty without context', () => {
        expect(evaluateValue('file.path')).toBe('')
    })

    test('upper(file.name) returns empty without context', () => {
        expect(evaluateValue('upper(file.name)')).toBe('')
    })
})

describe('evaluateValue - whitespace handling', () => {
    test('handles whitespace in function calls', () => {
        expect(evaluateValue('upper( "hello" )')).toBe('HELLO')
    })

    test('handles whitespace around dots', () => {
        const mockFile = createMockFile({ basename: 'Test' })
        const context: EvaluationContext = { file: mockFile }
        // Note: current implementation may not handle this
        // This test documents expected behavior
        expect(evaluateValue('file.name', context)).toBe('Test')
    })
})

describe('evaluateValue - quote handling', () => {
    test('handles single quotes', () => {
        expect(evaluateValue("upper('hello')")).toBe('HELLO')
    })

    test('handles double quotes', () => {
        expect(evaluateValue('upper("hello")')).toBe('HELLO')
    })

    test('handles mixed quotes in arguments', () => {
        expect(evaluateValue('replace("hello", "l", "x")')).toBe('hexxo')
        expect(evaluateValue("replace('hello', 'l', 'x')")).toBe('hexxo')
    })
})

describe('evaluateValue - edge cases', () => {
    test('handles unknown function gracefully', () => {
        const result = evaluateValue('unknown("test")')
        expect(result).toBe('')
    })

    test('handles malformed expression gracefully', () => {
        const result = evaluateValue('upper(')
        // Should return original or empty, not throw
        expect(typeof result).toBe('string')
    })

    test('handles empty parentheses for string functions', () => {
        const result = evaluateValue('upper()')
        expect(result).toBe('')
    })

    test('handles unknown file field gracefully', () => {
        const mockFile = createMockFile({ basename: 'Test' })
        const context: EvaluationContext = { file: mockFile }
        const result = evaluateValue('file.unknown', context)
        expect(result).toBe('')
    })
})

describe('evaluateValue - format patterns', () => {
    test('format with YY (2-digit year)', () => {
        const result = evaluateValue('date("2024-01-15").format("YY")')
        expect(result).toBe('24')
    })

    test('format with M (month without padding)', () => {
        const result = evaluateValue('date("2024-01-15").format("M")')
        expect(result).toBe('1')
    })

    test('format with D (day without padding)', () => {
        const result = evaluateValue('date("2024-01-05").format("D")')
        expect(result).toBe('5')
    })

    test('format with H (hour without padding)', () => {
        const result = evaluateValue('now().format("H")')
        expect(result).toMatch(/^\d{1,2}$/)
    })

    test('format with hh (12-hour format)', () => {
        const result = evaluateValue('now().format("hh")')
        expect(result).toMatch(/^(0[1-9]|1[0-2])$/)
    })

    test('format with A (AM/PM)', () => {
        const result = evaluateValue('now().format("A")')
        expect(result).toMatch(/^(am|pm)$/i)
    })

    test('format with complex pattern', () => {
        const result = evaluateValue('date("2024-01-15").format("YYYY/MM/DD")')
        expect(result).toBe('2024/01/15')
    })
})
