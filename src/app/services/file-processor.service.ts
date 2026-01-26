import type { App, TFile } from 'obsidian'
import type { PluginSettings } from '../types/plugin-settings.intf'
import type { ExpanderMatch, ProcessingResult, ReplacementResult } from '../types/expander.types'
import type { ExpanderService } from './expander.service'
import { findExpansions } from '../utils/find-expansions'
import { processInBatches } from '../utils/batch-processor'
import { log } from '../../utils/log'
import {
    MODE_TO_OPEN_MARKER,
    MODE_TO_END_MARKER,
    EXPANDER_CLOSE,
    EXPANDER_END_SUFFIX
} from '../constants'
import type { UpdateMode } from '../constants'

/**
 * Service for processing files and replacing expansions
 */
export class FileProcessorService {
    constructor(
        private app: App,
        private expanderService: ExpanderService,
        private getSettings: () => PluginSettings
    ) {}

    /**
     * Process a single file and replace expansions
     */
    async processFile(file: TFile, mode: 'auto' | 'all' = 'all'): Promise<ProcessingResult> {
        const result: ProcessingResult = {
            file,
            replacementsCount: 0,
            unknownKeys: [],
            errors: []
        }

        try {
            const content = await this.app.vault.read(file)
            const replacementResult = this.replaceExpansions(content, mode)

            if (replacementResult.newContent !== null) {
                await this.app.vault.modify(file, replacementResult.newContent)
                result.replacementsCount = replacementResult.replacementsCount
            }

            result.unknownKeys = replacementResult.unknownKeys
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            result.errors.push(errorMessage)
            log(`Error processing file ${file.path}: ${errorMessage}`, 'error')
        }

        return result
    }

    /**
     * Process all files in vault (respecting folder settings)
     */
    async processVault(): Promise<ProcessingResult[]> {
        const files = this.getFilesToProcess()
        log(`Processing ${files.length} files`, 'info')

        const results = await processInBatches(files, (file) => this.processFile(file, 'all'))

        return results
    }

    /**
     * Process a single expansion in a file (for refresh button)
     */
    async processExpansion(file: TFile, key: string): Promise<boolean> {
        try {
            const content = await this.app.vault.read(file)
            const matches = findExpansions(content)
            const match = matches.find((m) => m.key === key)

            if (!match) {
                return false
            }

            const newValue = this.expanderService.getReplacementValue(key)
            if (newValue === null) {
                return false
            }

            // Check if value actually changed
            if (match.currentValue === newValue) {
                return true
            }

            // Build new content
            const newContent = this.replaceMatch(content, match, newValue)
            await this.app.vault.modify(file, newContent)
            return true
        } catch (error) {
            log(`Error processing expansion ${key} in ${file.path}`, 'error', error)
            return false
        }
    }

    /**
     * Get all files that should be processed based on settings
     */
    getFilesToProcess(): TFile[] {
        const settings = this.getSettings()
        const allFiles = this.app.vault.getMarkdownFiles()

        return allFiles.filter((file) => this.shouldProcessFile(file, settings))
    }

    /**
     * Check if a file should be processed based on folder settings
     */
    shouldProcessFile(file: TFile, settings?: PluginSettings): boolean {
        const s = settings ?? this.getSettings()

        // Check ignored folders
        for (const folder of s.ignoredFolders) {
            if (folder && file.path.startsWith(folder)) {
                return false
            }
        }

        // If foldersToScan is empty, scan all (non-ignored) folders
        if (s.foldersToScan.length === 0) {
            return true
        }

        // Check if file is in any of the folders to scan
        for (const folder of s.foldersToScan) {
            if (folder && file.path.startsWith(folder)) {
                return true
            }
        }

        return false
    }

    /**
     * Replace expansions in content
     * @param content - The file content
     * @param mode - 'auto' for automatic updates only, 'all' for all update modes
     * @returns New content if changed, null otherwise
     */
    replaceExpansions(content: string, mode: 'auto' | 'all' = 'all'): ReplacementResult {
        const matches = findExpansions(content)
        const unknownKeys: string[] = []
        let newContent = content
        let replacementsCount = 0
        let hasChanges = false

        // Process matches from end to start to maintain correct offsets
        const sortedMatches = [...matches].sort((a, b) => b.startOffset - a.startOffset)

        for (const match of sortedMatches) {
            // Skip non-auto modes if we're in auto mode
            if (mode === 'auto' && match.updateMode !== 'auto') {
                continue
            }

            // Skip 'once' and 'once-and-eject' if they have content (already processed)
            if (
                (match.updateMode === 'once' || match.updateMode === 'once-and-eject') &&
                match.currentValue.trim() !== ''
            ) {
                continue
            }

            const newValue = this.expanderService.getReplacementValue(match.key)

            if (newValue === null) {
                if (!unknownKeys.includes(match.key)) {
                    unknownKeys.push(match.key)
                }
                continue
            }

            // Check if value actually changed
            if (match.currentValue === newValue) {
                continue
            }

            // Apply replacement
            if (match.updateMode === 'once-and-eject') {
                // For once-and-eject, replace the entire match with just the value
                newContent =
                    newContent.substring(0, match.startOffset) +
                    newValue +
                    newContent.substring(match.endOffset)
            } else {
                // For other modes, preserve markers
                newContent = this.replaceMatch(newContent, match, newValue)
            }

            replacementsCount++
            hasChanges = true
        }

        return {
            newContent: hasChanges ? newContent : null,
            unknownKeys,
            replacementsCount
        }
    }

    /**
     * Replace a single match with a new value (preserving markers)
     */
    private replaceMatch(content: string, match: ExpanderMatch, newValue: string): string {
        const openMarker = this.buildOpenMarker(match.updateMode, match.key)
        const closeMarker = this.buildCloseMarker(match.updateMode, match.key)

        const newMatch = openMarker + newValue + closeMarker

        return (
            content.substring(0, match.startOffset) + newMatch + content.substring(match.endOffset)
        )
    }

    /**
     * Build opening marker for a given mode and key
     */
    private buildOpenMarker(mode: UpdateMode, key: string): string {
        return MODE_TO_OPEN_MARKER[mode] + key + EXPANDER_CLOSE
    }

    /**
     * Build closing marker for a given mode and key
     */
    private buildCloseMarker(mode: UpdateMode, key: string): string {
        return MODE_TO_END_MARKER[mode] + key + EXPANDER_END_SUFFIX
    }
}
