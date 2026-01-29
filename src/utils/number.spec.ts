import { describe, test, expect } from 'bun:test'
import { NumberValue, createNumber, parseNumber, minValue, maxValue } from './number'

describe('NumberValue', () => {
    describe('abs()', () => {
        test('returns absolute value of positive number', () => {
            const nv = new NumberValue(5)
            expect(nv.abs().getValue()).toBe(5)
        })

        test('returns absolute value of negative number', () => {
            const nv = new NumberValue(-5)
            expect(nv.abs().getValue()).toBe(5)
        })

        test('handles zero', () => {
            const nv = new NumberValue(0)
            expect(nv.abs().getValue()).toBe(0)
        })

        test('handles decimal numbers', () => {
            const nv = new NumberValue(-3.14)
            expect(nv.abs().getValue()).toBe(3.14)
        })
    })

    describe('ceil()', () => {
        test('rounds up positive decimal', () => {
            const nv = new NumberValue(3.2)
            expect(nv.ceil().getValue()).toBe(4)
        })

        test('rounds up negative decimal', () => {
            const nv = new NumberValue(-3.2)
            expect(nv.ceil().getValue()).toBe(-3)
        })

        test('handles integer', () => {
            const nv = new NumberValue(5)
            expect(nv.ceil().getValue()).toBe(5)
        })

        test('handles zero', () => {
            const nv = new NumberValue(0)
            expect(nv.ceil().getValue()).toBe(0)
        })
    })

    describe('floor()', () => {
        test('rounds down positive decimal', () => {
            const nv = new NumberValue(3.9)
            expect(nv.floor().getValue()).toBe(3)
        })

        test('rounds down negative decimal', () => {
            const nv = new NumberValue(-3.2)
            expect(nv.floor().getValue()).toBe(-4)
        })

        test('handles integer', () => {
            const nv = new NumberValue(5)
            expect(nv.floor().getValue()).toBe(5)
        })

        test('handles zero', () => {
            const nv = new NumberValue(0)
            expect(nv.floor().getValue()).toBe(0)
        })
    })

    describe('round()', () => {
        test('rounds to nearest integer by default', () => {
            const nv = new NumberValue(3.6)
            expect(nv.round().getValue()).toBe(4)
        })

        test('rounds down at 0.5', () => {
            const nv = new NumberValue(3.5)
            expect(nv.round().getValue()).toBe(4)
        })

        test('rounds to specified decimal places', () => {
            const nv = new NumberValue(3.14159)
            expect(nv.round(2).getValue()).toBe(3.14)
        })

        test('handles negative numbers', () => {
            const nv = new NumberValue(-3.6)
            expect(nv.round().getValue()).toBe(-4)
        })

        test('handles zero digits', () => {
            const nv = new NumberValue(3.9)
            expect(nv.round(0).getValue()).toBe(4)
        })
    })

    describe('toFixed()', () => {
        test('formats with specified decimal places', () => {
            const nv = new NumberValue(3.14159)
            expect(nv.toFixed(2)).toBe('3.14')
        })

        test('pads with zeros if needed', () => {
            const nv = new NumberValue(3)
            expect(nv.toFixed(2)).toBe('3.00')
        })

        test('handles zero precision', () => {
            const nv = new NumberValue(3.9)
            expect(nv.toFixed(0)).toBe('4')
        })

        test('handles negative numbers', () => {
            const nv = new NumberValue(-3.14159)
            expect(nv.toFixed(2)).toBe('-3.14')
        })
    })

    describe('isEmpty()', () => {
        test('returns false for valid number', () => {
            const nv = new NumberValue(5)
            expect(nv.isEmpty()).toBe(false)
        })

        test('returns false for zero', () => {
            const nv = new NumberValue(0)
            expect(nv.isEmpty()).toBe(false)
        })

        test('returns true for NaN', () => {
            const nv = new NumberValue(NaN)
            expect(nv.isEmpty()).toBe(true)
        })
    })

    describe('getValue()', () => {
        test('returns underlying number', () => {
            const nv = new NumberValue(42)
            expect(nv.getValue()).toBe(42)
        })
    })

    describe('toString()', () => {
        test('returns string representation', () => {
            const nv = new NumberValue(42)
            expect(nv.toString()).toBe('42')
        })

        test('handles decimals', () => {
            const nv = new NumberValue(3.14)
            expect(nv.toString()).toBe('3.14')
        })

        test('handles negative numbers', () => {
            const nv = new NumberValue(-5)
            expect(nv.toString()).toBe('-5')
        })
    })

    describe('chaining', () => {
        test('chains abs().ceil()', () => {
            const nv = new NumberValue(-3.2)
            expect(nv.abs().ceil().getValue()).toBe(4)
        })

        test('chains floor().abs()', () => {
            const nv = new NumberValue(-3.9)
            expect(nv.floor().abs().getValue()).toBe(4)
        })

        test('chains round().abs()', () => {
            const nv = new NumberValue(-3.6)
            expect(nv.round().abs().getValue()).toBe(4)
        })
    })
})

describe('createNumber()', () => {
    test('creates NumberValue instance', () => {
        const result = createNumber(42)
        expect(result instanceof NumberValue).toBe(true)
    })

    test('wraps provided number', () => {
        const result = createNumber(42)
        expect(result.getValue()).toBe(42)
    })

    test('allows chaining after creation', () => {
        const result = createNumber(-5).abs()
        expect(result.getValue()).toBe(5)
    })
})

describe('parseNumber()', () => {
    test('parses integer string', () => {
        const result = parseNumber('42')
        expect(result.getValue()).toBe(42)
    })

    test('parses decimal string', () => {
        const result = parseNumber('3.14')
        expect(result.getValue()).toBe(3.14)
    })

    test('parses negative string', () => {
        const result = parseNumber('-5')
        expect(result.getValue()).toBe(-5)
    })

    test('passes through number', () => {
        const result = parseNumber(42)
        expect(result.getValue()).toBe(42)
    })

    test('returns NaN for invalid string', () => {
        const result = parseNumber('abc')
        expect(result.isEmpty()).toBe(true)
    })

    test('parses number with leading text (parseFloat behavior)', () => {
        const result = parseNumber('42abc')
        expect(result.getValue()).toBe(42)
    })
})

describe('minValue()', () => {
    test('returns minimum of multiple values', () => {
        const result = minValue(5, 3, 8, 1, 9)
        expect(result.getValue()).toBe(1)
    })

    test('handles single value', () => {
        const result = minValue(5)
        expect(result.getValue()).toBe(5)
    })

    test('handles negative values', () => {
        const result = minValue(-5, -3, -8)
        expect(result.getValue()).toBe(-8)
    })

    test('handles mixed positive and negative', () => {
        const result = minValue(-5, 3, 0)
        expect(result.getValue()).toBe(-5)
    })
})

describe('maxValue()', () => {
    test('returns maximum of multiple values', () => {
        const result = maxValue(5, 3, 8, 1, 9)
        expect(result.getValue()).toBe(9)
    })

    test('handles single value', () => {
        const result = maxValue(5)
        expect(result.getValue()).toBe(5)
    })

    test('handles negative values', () => {
        const result = maxValue(-5, -3, -8)
        expect(result.getValue()).toBe(-3)
    })

    test('handles mixed positive and negative', () => {
        const result = maxValue(-5, 3, 0)
        expect(result.getValue()).toBe(3)
    })
})
