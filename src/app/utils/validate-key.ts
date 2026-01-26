import { KEY_PATTERN } from '../constants'

/**
 * Check if a key is valid kebab-case format
 * Valid: lowercase letters, numbers, hyphens (no leading/trailing hyphens)
 * Examples: "my-key", "hello-world-123", "simple"
 */
export function isValidKey(key: string): boolean {
    if (!key || typeof key !== 'string') {
        return false
    }
    return KEY_PATTERN.test(key)
}

/**
 * Normalize a key to lowercase and trimmed
 * Does not validate - use isValidKey() for validation
 */
export function normalizeKey(key: string): string {
    return key.toLowerCase().trim()
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

    if (normalized !== key) {
        return 'Key must be lowercase and trimmed'
    }

    if (!isValidKey(key)) {
        return 'Key must be kebab-case (lowercase letters, numbers, hyphens only, no leading/trailing hyphens)'
    }

    return null
}
