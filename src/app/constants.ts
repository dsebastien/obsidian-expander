/**
 * Update modes for expander markers
 */
export type UpdateMode = 'auto' | 'manual' | 'once' | 'once-and-eject'

/**
 * Opening markers by mode
 */
export const EXPANDER_OPEN = '<!-- expander: '
export const EXPANDER_MANUAL_OPEN = '<!-- expander-manual: '
export const EXPANDER_ONCE_OPEN = '<!-- expander-once: '
export const EXPANDER_ONCE_AND_EJECT_OPEN = '<!-- expander-once-and-eject: '
export const EXPANDER_CLOSE = ' -->'

/**
 * Closing markers by mode
 */
export const EXPANDER_END = '<!-- /expander: '
export const EXPANDER_MANUAL_END = '<!-- /expander-manual: '
export const EXPANDER_ONCE_END = '<!-- /expander-once: '
export const EXPANDER_ONCE_AND_EJECT_END = '<!-- /expander-once-and-eject: '
export const EXPANDER_END_SUFFIX = ' -->'

/**
 * Key format pattern - kebab-case only (lowercase letters, numbers, hyphens)
 */
export const KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/

/**
 * Minimum milliseconds between automatic update events
 */
export const MINIMUM_MS_BETWEEN_EVENTS = 500

/**
 * Number of files to process concurrently in batch operations
 */
export const BATCH_SIZE = 5

/**
 * Duration in milliseconds for notice messages
 */
export const NOTICE_TIMEOUT = 5000

/**
 * Marker type to update mode mapping
 */
export const MARKER_TO_MODE: Record<string, UpdateMode> = {
    'expander': 'auto',
    'expander-manual': 'manual',
    'expander-once': 'once',
    'expander-once-and-eject': 'once-and-eject'
}

/**
 * Update mode to opening marker prefix mapping
 */
export const MODE_TO_OPEN_MARKER: Record<UpdateMode, string> = {
    'auto': EXPANDER_OPEN,
    'manual': EXPANDER_MANUAL_OPEN,
    'once': EXPANDER_ONCE_OPEN,
    'once-and-eject': EXPANDER_ONCE_AND_EJECT_OPEN
}

/**
 * Update mode to closing marker prefix mapping
 */
export const MODE_TO_END_MARKER: Record<UpdateMode, string> = {
    'auto': EXPANDER_END,
    'manual': EXPANDER_MANUAL_END,
    'once': EXPANDER_ONCE_END,
    'once-and-eject': EXPANDER_ONCE_AND_EJECT_END
}
