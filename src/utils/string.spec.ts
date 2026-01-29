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

    describe('title()', () => {
        test('capitalizes first letter of each word', () => {
            const sv = new StringValue('hello world')
            expect(sv.title().toString()).toBe('Hello World')
        })

        test('handles already title case', () => {
            const sv = new StringValue('Hello World')
            expect(sv.title().toString()).toBe('Hello World')
        })

        test('handles all caps', () => {
            const sv = new StringValue('HELLO WORLD')
            expect(sv.title().toString()).toBe('Hello World')
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.title().toString()).toBe('')
        })

        test('handles single word', () => {
            const sv = new StringValue('hello')
            expect(sv.title().toString()).toBe('Hello')
        })

        test('handles mixed case', () => {
            const sv = new StringValue('hELLo wORLd')
            expect(sv.title().toString()).toBe('Hello World')
        })
    })

    describe('slice()', () => {
        test('extracts substring with start and end', () => {
            const sv = new StringValue('hello world')
            expect(sv.slice(0, 5).toString()).toBe('hello')
        })

        test('extracts substring with start only', () => {
            const sv = new StringValue('hello world')
            expect(sv.slice(6).toString()).toBe('world')
        })

        test('handles negative start index', () => {
            const sv = new StringValue('hello world')
            expect(sv.slice(-5).toString()).toBe('world')
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.slice(0, 5).toString()).toBe('')
        })

        test('handles out of bounds', () => {
            const sv = new StringValue('hello')
            expect(sv.slice(0, 100).toString()).toBe('hello')
        })
    })

    describe('repeat()', () => {
        test('repeats string N times', () => {
            const sv = new StringValue('ab')
            expect(sv.repeat(3).toString()).toBe('ababab')
        })

        test('handles zero repetitions', () => {
            const sv = new StringValue('hello')
            expect(sv.repeat(0).toString()).toBe('')
        })

        test('handles one repetition', () => {
            const sv = new StringValue('hello')
            expect(sv.repeat(1).toString()).toBe('hello')
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.repeat(5).toString()).toBe('')
        })

        test('handles negative count as zero', () => {
            const sv = new StringValue('hello')
            expect(sv.repeat(-3).toString()).toBe('')
        })

        test('handles float count by flooring', () => {
            const sv = new StringValue('a')
            expect(sv.repeat(2.9).toString()).toBe('aa')
        })
    })

    describe('startsWith()', () => {
        test('returns true when string starts with query', () => {
            const sv = new StringValue('hello world')
            expect(sv.startsWith('hello')).toBe(true)
        })

        test('returns false when string does not start with query', () => {
            const sv = new StringValue('hello world')
            expect(sv.startsWith('world')).toBe(false)
        })

        test('returns true for empty query', () => {
            const sv = new StringValue('hello')
            expect(sv.startsWith('')).toBe(true)
        })

        test('returns true when query equals string', () => {
            const sv = new StringValue('hello')
            expect(sv.startsWith('hello')).toBe(true)
        })
    })

    describe('endsWith()', () => {
        test('returns true when string ends with query', () => {
            const sv = new StringValue('hello world')
            expect(sv.endsWith('world')).toBe(true)
        })

        test('returns false when string does not end with query', () => {
            const sv = new StringValue('hello world')
            expect(sv.endsWith('hello')).toBe(false)
        })

        test('returns true for empty query', () => {
            const sv = new StringValue('hello')
            expect(sv.endsWith('')).toBe(true)
        })

        test('returns true when query equals string', () => {
            const sv = new StringValue('hello')
            expect(sv.endsWith('hello')).toBe(true)
        })
    })

    describe('contains()', () => {
        test('returns true when string contains substring', () => {
            const sv = new StringValue('hello world')
            expect(sv.contains('lo wo')).toBe(true)
        })

        test('returns false when string does not contain substring', () => {
            const sv = new StringValue('hello world')
            expect(sv.contains('xyz')).toBe(false)
        })

        test('returns true for empty query', () => {
            const sv = new StringValue('hello')
            expect(sv.contains('')).toBe(true)
        })

        test('is case-sensitive', () => {
            const sv = new StringValue('Hello World')
            expect(sv.contains('hello')).toBe(false)
        })
    })

    describe('containsAll()', () => {
        test('returns true when all substrings are present', () => {
            const sv = new StringValue('hello world')
            expect(sv.containsAll('hello', 'world')).toBe(true)
        })

        test('returns false when some substrings are missing', () => {
            const sv = new StringValue('hello world')
            expect(sv.containsAll('hello', 'xyz')).toBe(false)
        })

        test('returns true for empty args', () => {
            const sv = new StringValue('hello')
            expect(sv.containsAll()).toBe(true)
        })
    })

    describe('containsAny()', () => {
        test('returns true when any substring is present', () => {
            const sv = new StringValue('hello world')
            expect(sv.containsAny('xyz', 'world')).toBe(true)
        })

        test('returns false when no substrings are present', () => {
            const sv = new StringValue('hello world')
            expect(sv.containsAny('xyz', 'abc')).toBe(false)
        })

        test('returns false for empty args', () => {
            const sv = new StringValue('hello')
            expect(sv.containsAny()).toBe(false)
        })
    })

    describe('isEmpty()', () => {
        test('returns true for empty string', () => {
            const sv = new StringValue('')
            expect(sv.isEmpty()).toBe(true)
        })

        test('returns false for non-empty string', () => {
            const sv = new StringValue('hello')
            expect(sv.isEmpty()).toBe(false)
        })

        test('returns false for whitespace only', () => {
            const sv = new StringValue('   ')
            expect(sv.isEmpty()).toBe(false)
        })
    })

    describe('reverse()', () => {
        test('reverses characters', () => {
            const sv = new StringValue('hello')
            expect(sv.reverse().toString()).toBe('olleh')
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.reverse().toString()).toBe('')
        })

        test('handles single character', () => {
            const sv = new StringValue('a')
            expect(sv.reverse().toString()).toBe('a')
        })

        test('handles palindrome', () => {
            const sv = new StringValue('racecar')
            expect(sv.reverse().toString()).toBe('racecar')
        })

        test('handles unicode characters', () => {
            const sv = new StringValue('abc😀')
            expect(sv.reverse().toString()).toBe('😀cba')
        })
    })

    describe('split()', () => {
        test('splits on separator', () => {
            const sv = new StringValue('a,b,c')
            expect(sv.split(',')).toEqual(['a', 'b', 'c'])
        })

        test('splits with limit', () => {
            const sv = new StringValue('a,b,c,d')
            expect(sv.split(',', 2)).toEqual(['a', 'b'])
        })

        test('handles empty string', () => {
            const sv = new StringValue('')
            expect(sv.split(',')).toEqual([''])
        })

        test('handles no matches', () => {
            const sv = new StringValue('hello')
            expect(sv.split(',')).toEqual(['hello'])
        })

        test('splits on empty separator', () => {
            const sv = new StringValue('abc')
            expect(sv.split('')).toEqual(['a', 'b', 'c'])
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
