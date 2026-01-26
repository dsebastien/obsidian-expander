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
