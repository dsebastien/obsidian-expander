import { describe, test, expect } from 'bun:test'
import { StringValue, createString } from './string'

describe('StringValue', () => {
    describe('lower()', () => {
        test('converts uppercase to lowercase', () => {
            const sv = new StringValue('HELLO')
            expect(sv.lower().toString()).toBe('hello')
        })

        test('handles mixed case', () => {
            const sv = new StringValue('Hello World')
            expect(sv.lower().toString()).toBe('hello world')
        })

        test('handles already lowercase', () => {
            const sv = new StringValue('hello')
            expect(sv.lower().toString()).toBe('hello')
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.lower().toString()).toBe('')
        })

        test('preserves numbers and special characters', () => {
            const sv = new StringValue('HELLO123!@#')
            expect(sv.lower().toString()).toBe('hello123!@#')
        })
    })

    describe('upper()', () => {
        test('converts lowercase to uppercase', () => {
            const sv = new StringValue('hello')
            expect(sv.upper().toString()).toBe('HELLO')
        })

        test('handles mixed case', () => {
            const sv = new StringValue('Hello World')
            expect(sv.upper().toString()).toBe('HELLO WORLD')
        })

        test('handles already uppercase', () => {
            const sv = new StringValue('HELLO')
            expect(sv.upper().toString()).toBe('HELLO')
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.upper().toString()).toBe('')
        })

        test('preserves numbers and special characters', () => {
            const sv = new StringValue('hello123!@#')
            expect(sv.upper().toString()).toBe('HELLO123!@#')
        })
    })

    describe('trim()', () => {
        test('removes leading whitespace', () => {
            const sv = new StringValue('   hello')
            expect(sv.trim().toString()).toBe('hello')
        })

        test('removes trailing whitespace', () => {
            const sv = new StringValue('hello   ')
            expect(sv.trim().toString()).toBe('hello')
        })

        test('removes both leading and trailing whitespace', () => {
            const sv = new StringValue('   hello   ')
            expect(sv.trim().toString()).toBe('hello')
        })

        test('preserves internal whitespace', () => {
            const sv = new StringValue('   hello world   ')
            expect(sv.trim().toString()).toBe('hello world')
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.trim().toString()).toBe('')
        })

        test('handles whitespace only', () => {
            const sv = new StringValue('      ')
            expect(sv.trim().toString()).toBe('')
        })

        test('handles tabs and newlines', () => {
            const sv = new StringValue('\t\nhello\t\n')
            expect(sv.trim().toString()).toBe('hello')
        })
    })

    describe('replace()', () => {
        test('replaces single occurrence', () => {
            const sv = new StringValue('hello world')
            expect(sv.replace('world', 'there').toString()).toBe('hello there')
        })

        test('replaces all occurrences', () => {
            const sv = new StringValue('a-b-c-d')
            expect(sv.replace('-', '_').toString()).toBe('a_b_c_d')
        })

        test('handles no matches', () => {
            const sv = new StringValue('hello')
            expect(sv.replace('x', 'y').toString()).toBe('hello')
        })

        test('handles empty pattern', () => {
            const sv = new StringValue('hello')
            // Empty regex replaces between every character
            expect(sv.replace('', 'X').toString()).toBe('XhXeXlXlXoX')
        })

        test('handles empty replacement', () => {
            const sv = new StringValue('hello')
            expect(sv.replace('l', '').toString()).toBe('heo')
        })

        test('handles special regex characters', () => {
            const sv = new StringValue('hello.world')
            // Note: '.' is a regex pattern, matches any character
            expect(sv.replace('.', '-').toString()).toBe('-----------')
        })

        test('handles regex escaping for literal replacement', () => {
            const sv = new StringValue('a/b/c')
            expect(sv.replace('/', '-').toString()).toBe('a-b-c')
        })
    })

    describe('getValue()', () => {
        test('returns underlying string', () => {
            const sv = new StringValue('hello')
            expect(sv.getValue()).toBe('hello')
        })
    })

    describe('toString()', () => {
        test('returns string representation', () => {
            const sv = new StringValue('hello')
            expect(sv.toString()).toBe('hello')
        })

        test('works in string concatenation', () => {
            const sv = new StringValue('world')
            expect('hello ' + sv.toString()).toBe('hello world')
        })
    })

    describe('chaining', () => {
        test('chains lower().upper()', () => {
            const sv = new StringValue('Hello')
            expect(sv.lower().upper().toString()).toBe('HELLO')
        })

        test('chains upper().lower()', () => {
            const sv = new StringValue('Hello')
            expect(sv.upper().lower().toString()).toBe('hello')
        })

        test('chains trim().upper()', () => {
            const sv = new StringValue('  hello  ')
            expect(sv.trim().upper().toString()).toBe('HELLO')
        })

        test('chains upper().replace()', () => {
            const sv = new StringValue('hello')
            expect(sv.upper().replace('L', 'X').toString()).toBe('HEXXO')
        })

        test('chains trim().lower().replace()', () => {
            // Note: order matters - trim first, then replace spaces
            const sv = new StringValue('  HELLO WORLD  ')
            expect(sv.trim().lower().replace(' ', '-').toString()).toBe('hello-world')
        })

        test('chains multiple replace() calls', () => {
            const sv = new StringValue('a/b\\c')
            expect(sv.replace('/', '-').replace('\\\\', '-').toString()).toBe('a-b-c')
        })
    })
})

describe('createString()', () => {
    test('creates StringValue instance', () => {
        const result = createString('hello')
        expect(result instanceof StringValue).toBe(true)
    })

    test('wraps provided string', () => {
        const result = createString('hello')
        expect(result.toString()).toBe('hello')
    })

    test('allows chaining after creation', () => {
        const result = createString('hello').upper()
        expect(result.toString()).toBe('HELLO')
    })

    test('handles empty string', () => {
        const result = createString('')
        expect(result.toString()).toBe('')
    })
})
