/**
 * String wrapper class for chaining operations
 * Provides a fluent API for string manipulation
 */
export class StringValue {
    constructor(private str: string) {}

    /**
     * Convert to lowercase
     */
    lower(): StringValue {
        return new StringValue(this.str.toLowerCase())
    }

    /**
     * Convert to uppercase
     */
    upper(): StringValue {
        return new StringValue(this.str.toUpperCase())
    }

    /**
     * Trim whitespace from both ends
     */
    trim(): StringValue {
        return new StringValue(this.str.trim())
    }

    /**
     * Replace all occurrences of a pattern with a replacement string
     * @param pattern - Regex pattern to match
     * @param replacement - String to replace matches with
     */
    replace(pattern: string, replacement: string): StringValue {
        return new StringValue(this.str.replace(new RegExp(pattern, 'g'), replacement))
    }

    /**
     * Convert to title case (capitalize first letter of each word)
     */
    title(): StringValue {
        return new StringValue(
            this.str.replace(
                /\w\S*/g,
                (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
            )
        )
    }

    /**
     * Extract a substring
     * @param start - Start index (0-based)
     * @param end - Optional end index (exclusive)
     */
    slice(start: number, end?: number): StringValue {
        return new StringValue(this.str.slice(start, end))
    }

    /**
     * Repeat the string N times
     * @param count - Number of repetitions (must be non-negative)
     */
    repeat(count: number): StringValue {
        const safeCount = Math.max(0, Math.floor(count))
        return new StringValue(this.str.repeat(safeCount))
    }

    /**
     * Check if string starts with the given query
     * @param query - String to test
     */
    startsWith(query: string): boolean {
        return this.str.startsWith(query)
    }

    /**
     * Check if string ends with the given query
     * @param query - String to test
     */
    endsWith(query: string): boolean {
        return this.str.endsWith(query)
    }

    /**
     * Check if string contains the given substring
     * @param value - Substring to search for
     */
    contains(value: string): boolean {
        return this.str.includes(value)
    }

    /**
     * Check if string contains all of the given substrings
     * @param values - Substrings to search for
     */
    containsAll(...values: string[]): boolean {
        return values.every((v) => this.str.includes(v))
    }

    /**
     * Check if string contains any of the given substrings
     * @param values - Substrings to search for
     */
    containsAny(...values: string[]): boolean {
        return values.some((v) => this.str.includes(v))
    }

    /**
     * Check if string is empty (zero length)
     */
    isEmpty(): boolean {
        return this.str.length === 0
    }

    /**
     * Reverse the string characters
     */
    reverse(): StringValue {
        return new StringValue([...this.str].reverse().join(''))
    }

    /**
     * Split string into an array
     * @param separator - Separator to split on
     * @param limit - Optional maximum number of splits
     */
    split(separator: string, limit?: number): string[] {
        return this.str.split(separator, limit)
    }

    /**
     * Get the underlying string value
     */
    getValue(): string {
        return this.str
    }

    /**
     * Get the string representation
     */
    toString(): string {
        return this.str
    }
}

/**
 * Create a StringValue from a string
 */
export function createString(str: string): StringValue {
    return new StringValue(str)
}
