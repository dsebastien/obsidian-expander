/**
 * A replacement definition - key-value pair for expansion
 */
export interface Replacement {
    /** Unique key in kebab-case format */
    key: string
    /** Static value or function expression (e.g., "now().format('YYYY-MM-DD')") */
    value: string
    /** Whether this replacement is enabled */
    enabled: boolean
}

/**
 * Plugin settings interface
 */
export interface PluginSettings {
    /** List of replacement definitions */
    replacements: Replacement[]
    /** Folders to scan for expansions (empty = all folders) */
    foldersToScan: string[]
    /** Folders to ignore during scanning */
    ignoredFolders: string[]
    /** Disable automatic updates on file change */
    disableAutomaticUpdates: boolean
    /** Show refresh button in editor decorations */
    showRefreshButton: boolean
}

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: PluginSettings = {
    replacements: [],
    foldersToScan: [],
    ignoredFolders: [],
    disableAutomaticUpdates: false,
    showRefreshButton: true
}
