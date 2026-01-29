/**
 * Frontmatter utility functions for parsing and updating YAML frontmatter
 */

/**
 * Prefix for property keys that should update frontmatter
 */
export const PROPERTY_PREFIX = 'prop.'

/**
 * Check if a key is a property key (updates frontmatter)
 */
export function isPropertyKey(key: string): boolean {
    return key.startsWith(PROPERTY_PREFIX)
}

/**
 * Extract the property name from a property key
 * e.g., "prop.foo" → "foo"
 */
export function getPropertyName(key: string): string {
    if (!isPropertyKey(key)) {
        return key
    }
    return key.slice(PROPERTY_PREFIX.length)
}

/**
 * Frontmatter parsing result
 */
export interface FrontmatterResult {
    /** Whether frontmatter exists */
    exists: boolean
    /** The parsed frontmatter as key-value pairs */
    data: Record<string, unknown>
    /** Start position of frontmatter (including opening ---) */
    startOffset: number
    /** End position of frontmatter (including closing ---) */
    endOffset: number
    /** The raw frontmatter string (without delimiters) */
    raw: string
}

/**
 * Parse frontmatter from content
 * Returns null if no valid frontmatter found
 */
export function parseFrontmatter(content: string): FrontmatterResult | null {
    // Frontmatter must start at the very beginning of the file
    if (!content.startsWith('---')) {
        return null
    }

    // Find the closing delimiter
    const endMatch = content.indexOf('\n---', 3)
    if (endMatch === -1) {
        return null
    }

    const raw = content.slice(4, endMatch) // Skip opening "---\n"
    const endOffset = endMatch + 4 // Include closing "---\n" or "---"

    // Parse YAML-like content (simple key: value pairs)
    const data: Record<string, unknown> = {}
    const lines = raw.split('\n')

    for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed === '' || trimmed.startsWith('#')) {
            continue
        }

        const colonIndex = trimmed.indexOf(':')
        if (colonIndex === -1) {
            continue
        }

        const key = trimmed.slice(0, colonIndex).trim()
        let value: unknown = trimmed.slice(colonIndex + 1).trim()

        // Handle quoted strings
        if (
            (typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) ||
            (typeof value === 'string' && value.startsWith("'") && value.endsWith("'"))
        ) {
            value = value.slice(1, -1)
        }

        // Handle booleans
        if (value === 'true') value = true
        if (value === 'false') value = false

        // Handle numbers
        if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
            value = Number(value)
        }

        if (key) {
            data[key] = value
        }
    }

    return {
        exists: true,
        data,
        startOffset: 0,
        endOffset,
        raw
    }
}

/**
 * Update a single property in frontmatter
 * Creates frontmatter if it doesn't exist
 *
 * @param content - The file content
 * @param propertyName - The property name to set
 * @param value - The value to set
 * @returns Updated content
 */
export function updateFrontmatterProperty(
    content: string,
    propertyName: string,
    value: string
): string {
    const parsed = parseFrontmatter(content)

    if (!parsed) {
        // No frontmatter exists, create it
        const frontmatter = `---\n${propertyName}: ${formatYamlValue(value)}\n---\n`
        return frontmatter + content
    }

    // Frontmatter exists, update it
    const lines = parsed.raw.split('\n')
    let found = false
    const newLines: string[] = []

    for (const line of lines) {
        const trimmed = line.trim()

        // Check if this line is the property we want to update
        if (trimmed.startsWith(propertyName + ':')) {
            newLines.push(`${propertyName}: ${formatYamlValue(value)}`)
            found = true
        } else {
            newLines.push(line)
        }
    }

    // If property wasn't found, add it
    if (!found) {
        newLines.push(`${propertyName}: ${formatYamlValue(value)}`)
    }

    const newFrontmatter = `---\n${newLines.join('\n')}\n---`
    return newFrontmatter + content.slice(parsed.endOffset)
}

/**
 * Format a value for YAML output
 * Quotes strings that need quoting
 */
function formatYamlValue(value: string): string {
    // Check if value needs quoting
    const needsQuotes =
        value.includes(':') ||
        value.includes('#') ||
        value.includes("'") ||
        value.includes('"') ||
        value.includes('\n') ||
        value.startsWith(' ') ||
        value.endsWith(' ') ||
        value === 'true' ||
        value === 'false' ||
        value === 'null' ||
        value === '' ||
        !isNaN(Number(value))

    if (needsQuotes) {
        // Use double quotes and escape internal double quotes
        return `"${value.replace(/"/g, '\\"')}"`
    }

    return value
}

/**
 * Get a property value from frontmatter
 */
export function getFrontmatterProperty(content: string, propertyName: string): unknown | undefined {
    const parsed = parseFrontmatter(content)
    if (!parsed) {
        return undefined
    }
    return parsed.data[propertyName]
}
