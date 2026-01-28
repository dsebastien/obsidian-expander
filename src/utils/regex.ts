import type { UpdateMode } from '../app/constants'
import type { ExpanderMatch } from '../app/types/expander.types'

/**
 * Pre-compiled regex for matching all expander marker variants
 * Captures: opening marker type, key, value content, closing marker type, closing key
 *
 * Pattern breakdown:
 * - <!--\s*(expand(?:-(?:manual|once(?:-and-eject)?))?):\s* - Opening marker with variant
 * - ([a-z0-9]+(?:-[a-z0-9]+)*) - Key in kebab-case
 * - \s*--> - End of opening marker
 * - ([\s\S]*?) - Value content (non-greedy, including newlines)
 * - <!--\s*\/(expand(?:-(?:manual|once(?:-and-eject)?))?):\s* - Closing marker with variant
 * - ([a-z0-9]+(?:-[a-z0-9]+)*) - Closing key for validation
 * - \s*--> - End of closing marker
 */
const EXPANDER_REGEX =
    /<!--\s*(expand(?:-(?:manual|once(?:-and-eject)?))?):\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*-->([\s\S]*?)<!--\s*\/(expand(?:-(?:manual|once(?:-and-eject)?))?):\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*-->/g

/**
 * Map marker type string to UpdateMode
 */
function markerToMode(marker: string): UpdateMode {
    switch (marker) {
        case 'expand':
            return 'auto'
        case 'expand-manual':
            return 'manual'
        case 'expand-once':
            return 'once'
        case 'expand-once-and-eject':
            return 'once-and-eject'
        default:
            return 'auto'
    }
}

/**
 * Find all expander markers in the given text
 * Returns an array of matches with parsed information
 */
export function findExpansions(text: string): ExpanderMatch[] {
    const matches: ExpanderMatch[] = []

    // Reset regex state
    EXPANDER_REGEX.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = EXPANDER_REGEX.exec(text)) !== null) {
        const openMarkerType = match[1]
        const openKey = match[2]
        const value = match[3]
        const closeMarkerType = match[4]
        const closeKey = match[5]

        // Ensure all captures are present
        if (!openMarkerType || !openKey || value === undefined || !closeMarkerType || !closeKey) {
            continue
        }

        // Validate that opening and closing markers match
        if (openMarkerType !== closeMarkerType) {
            continue
        }

        // Validate that opening and closing keys match
        if (openKey !== closeKey) {
            continue
        }

        const updateMode = markerToMode(openMarkerType)
        const fullMatch = match[0]
        const startOffset = match.index
        const endOffset = startOffset + fullMatch.length

        matches.push({
            key: openKey,
            currentValue: value,
            startOffset,
            endOffset,
            fullMatch,
            updateMode,
            openMarker: `<!-- ${openMarkerType}: ${openKey} -->`,
            closeMarker: `<!-- /${closeMarkerType}: ${closeKey} -->`
        })
    }

    return matches
}

/**
 * Escape special regex characters in a string
 */
export function escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Build a regex to match a specific expander marker
 */
export function buildMarkerRegex(markerType: string, key: string): RegExp {
    const escapedKey = escapeRegExp(key)
    return new RegExp(
        `<!--\\s*${markerType}:\\s*${escapedKey}\\s*-->([\\s\\S]*?)<!--\\s*\\/${markerType}:\\s*${escapedKey}\\s*-->`,
        'g'
    )
}
