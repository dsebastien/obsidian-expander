import type { UpdateMode } from '../app/constants'
import type { ExpanderMatch, IncompleteExpansion } from '../app/types/expander.types'

/**
 * Pre-compiled regex for matching all expander marker variants
 * Captures: opening marker type, key, value content
 *
 * Pattern breakdown:
 * - <!--\s*(expand(?:-(?:manual|once(?:-and-eject)?))?):\s* - Opening marker with variant
 * - ([a-z0-9]+(?:-[a-z0-9]+)*) - Key in kebab-case
 * - \s*--> - End of opening marker
 * - ([\s\S]*?) - Value content (non-greedy, including newlines)
 * - <!--\s*--> - Universal closing marker (empty comment)
 */
const EXPANDER_REGEX =
    /<!--\s*(expand(?:-(?:manual|once(?:-and-eject)?))?):\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*-->([\s\S]*?)<!--\s*-->/g

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

        // Ensure all captures are present
        if (!openMarkerType || !openKey || value === undefined) {
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
            closeMarker: '<!---->'
        })
    }

    return matches
}

/**
 * Regex for matching opening markers only (without closing tag)
 */
const OPENING_MARKER_REGEX =
    /<!--\s*(expand(?:-(?:manual|once(?:-and-eject)?))?):\s*([a-z0-9]+(?:-[a-z0-9]+)*)\s*-->/g

/**
 * Find incomplete expansions (opening tags without closing tags)
 * These need to have a closing tag added during processing
 */
export function findIncompleteExpansions(text: string): IncompleteExpansion[] {
    // First, find all complete expansions to know which opening tags are already paired
    const completeMatches = findExpansions(text)
    const pairedOffsets = new Set(completeMatches.map((m) => m.startOffset))

    const incomplete: IncompleteExpansion[] = []

    // Reset regex state
    OPENING_MARKER_REGEX.lastIndex = 0

    let match: RegExpExecArray | null
    while ((match = OPENING_MARKER_REGEX.exec(text)) !== null) {
        const startOffset = match.index

        // Skip if this opening tag is part of a complete expansion
        if (pairedOffsets.has(startOffset)) {
            continue
        }

        const markerType = match[1]
        const key = match[2]

        if (!markerType || !key) {
            continue
        }

        const fullMatch = match[0]
        const endOffset = startOffset + fullMatch.length

        incomplete.push({
            key,
            startOffset,
            endOffset,
            openMarker: fullMatch,
            updateMode: markerToMode(markerType)
        })
    }

    return incomplete
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
    return new RegExp(`<!--\\s*${markerType}:\\s*${escapedKey}\\s*-->([\\s\\S]*?)<!--\\s*-->`, 'g')
}
