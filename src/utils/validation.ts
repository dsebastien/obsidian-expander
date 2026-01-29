import { KEY_PATTERN, PROP_KEY_PATTERN } from '../app/constants'

/**
 * Check if a key is valid
 * - Regular keys: kebab-case (lowercase letters, numbers, hyphens)
 * - Property keys: "prop." followed by any non-empty property name
 * Examples: "my-key", "hello-world-123", "prop.foo", "prop.foo bar", "prop.foo_bar"
 */
export function isValidKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
        return false
    }
    return KEY_PATTERN.test(key) || PROP_KEY_PATTERN.test(key)
}

/**
 * Check if a key is a property key (starts with "prop.")
 */
function isPropKey(key: string): boolean {
    return key.startsWith('prop.')
}

/**
 * Normalize a key
 * - Regular keys: lowercase and trimmed
 * - Property keys: trim key and property name, preserve case
 * Does not validate - use isValidKey() for validation
 */
export function normalizeKey(key: string): string {
    const trimmed = key.trim()
    if (isPropKey(trimmed)) {
        // Trim the property name part after "prop."
        const propName = trimmed.slice(5).trim() // Remove "prop." and trim
        return `prop.${propName}`
    }
    return trimmed.toLowerCase()
}

/**
 * Validate a key and return an error message if invalid
 * Returns null if key is valid
 */
export function validateKey(key: string): string | null {
    if (!key || key.trim().length === 0) {
        return 'Key cannot be empty'
    }

    const normalized = normalizeKey(key)

    // For prop.* keys, check the property name is not empty after trimming
    if (isPropKey(normalized)) {
        const propName = normalized.slice(5) // Remove "prop."
        if (propName.length === 0) {
            return 'Property key must be "prop." followed by a property name (e.g., prop.updated)'
        }
        return null
    }

    // For regular keys, check lowercase and kebab-case
    if (normalized !== key.trim().toLowerCase()) {
        return 'Key must be lowercase'
    }

    if (!KEY_PATTERN.test(normalized)) {
        return 'Key must be kebab-case (lowercase letters, numbers, hyphens only)'
    }

    return null
}
