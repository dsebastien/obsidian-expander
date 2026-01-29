/**
 * Number wrapper class for chaining operations
 * Provides a fluent API for number manipulation
 */
export class NumberValue {
    constructor(private num: number) {}

    /**
     * Get the absolute value
     */
    abs(): NumberValue {
        return new NumberValue(Math.abs(this.num))
    }

    /**
     * Round up to the nearest integer
     */
    ceil(): NumberValue {
        return new NumberValue(Math.ceil(this.num))
    }

    /**
     * Round down to the nearest integer
     */
    floor(): NumberValue {
        return new NumberValue(Math.floor(this.num))
    }

    /**
     * Round to the nearest integer, or to specified decimal places
     * @param digits - Number of decimal places (default: 0)
     */
    round(digits: number = 0): NumberValue {
        const factor = Math.pow(10, digits)
        return new NumberValue(Math.round(this.num * factor) / factor)
    }

    /**
     * Format number with fixed decimal places
     * @param precision - Number of decimal places
     */
    toFixed(precision: number): string {
        return this.num.toFixed(precision)
    }

    /**
     * Check if value is NaN
     */
    isEmpty(): boolean {
        return isNaN(this.num)
    }

    /**
     * Get the underlying number value
     */
    getValue(): number {
        return this.num
    }

    /**
     * Get string representation
     */
    toString(): string {
        return String(this.num)
    }
}

/**
 * Create a NumberValue from a number
 */
export function createNumber(num: number): NumberValue {
    return new NumberValue(num)
}

/**
 * Parse a value to a NumberValue
 * @param input - Value to parse (string or number)
 * @returns NumberValue (may contain NaN if parsing fails)
 */
export function parseNumber(input: string | number): NumberValue {
    if (typeof input === 'number') {
        return new NumberValue(input)
    }
    const parsed = parseFloat(input)
    return new NumberValue(parsed)
}

/**
 * Get the minimum of multiple values
 */
export function minValue(...values: number[]): NumberValue {
    return new NumberValue(Math.min(...values))
}

/**
 * Get the maximum of multiple values
 */
export function maxValue(...values: number[]): NumberValue {
    return new NumberValue(Math.max(...values))
}
