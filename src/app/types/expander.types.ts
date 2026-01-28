import type { TFile } from 'obsidian'
import type { UpdateMode } from '../constants'

/**
 * Represents a matched expander marker in the document
 */
export interface ExpanderMatch {
    /** The key used in the expander marker */
    key: string
    /** The current value between the markers */
    currentValue: string
    /** Character offset where the full match starts */
    startOffset: number
    /** Character offset where the full match ends */
    endOffset: number
    /** The complete matched string including markers */
    fullMatch: string
    /** The update mode for this expander */
    updateMode: UpdateMode
    /** The actual opening marker used (e.g., "<!-- expand: key -->") */
    openMarker: string
    /** The actual closing marker used (e.g., "<!-- /expand: key -->") */
    closeMarker: string
}

/**
 * Result of processing a single file
 */
export interface ProcessingResult {
    /** The file that was processed */
    file: TFile
    /** Number of replacements made */
    replacementsCount: number
    /** Keys that were found but not configured */
    unknownKeys: string[]
    /** Any errors encountered during processing */
    errors: string[]
}

/**
 * Result of replacing expansions in content
 */
export interface ReplacementResult {
    /** The new content with replacements, or null if no changes */
    newContent: string | null
    /** Keys that were found but not configured */
    unknownKeys: string[]
    /** Number of replacements made */
    replacementsCount: number
}
