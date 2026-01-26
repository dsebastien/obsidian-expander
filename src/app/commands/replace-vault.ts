import { Notice } from 'obsidian'
import type { ExpanderPlugin } from '../plugin'
import { NOTICE_TIMEOUT } from '../constants'
import { log } from '../../utils/log'

/**
 * Register the "Replace values in vault" command
 */
export function registerReplaceVaultCommand(plugin: ExpanderPlugin): void {
    plugin.addCommand({
        id: 'replace-vault',
        name: 'Replace values in vault',
        callback: () => {
            void replaceInVault(plugin)
        }
    })
}

/**
 * Execute replacement in all files in vault
 */
async function replaceInVault(plugin: ExpanderPlugin): Promise<void> {
    log('Replacing values in vault', 'info')

    try {
        new Notice('Processing vault...', NOTICE_TIMEOUT / 2)

        const results = await plugin.fileProcessor.processVault()

        // Calculate totals
        let totalReplacements = 0
        let totalFiles = 0
        const allUnknownKeys = new Set<string>()
        const filesWithErrors: string[] = []

        for (const result of results) {
            if (result.replacementsCount > 0) {
                totalReplacements += result.replacementsCount
                totalFiles++
            }
            for (const key of result.unknownKeys) {
                allUnknownKeys.add(key)
            }
            if (result.errors.length > 0) {
                filesWithErrors.push(result.file.basename)
            }
        }

        // Report errors
        if (filesWithErrors.length > 0) {
            log(`Errors in files: ${filesWithErrors.join(', ')}`, 'error')
        }

        // Report unknown keys
        if (allUnknownKeys.size > 0) {
            const unknownKeysList = Array.from(allUnknownKeys).join(', ')
            log(`Unknown keys: ${unknownKeysList}`, 'warn')
            new Notice(`Unknown keys: ${unknownKeysList}`, NOTICE_TIMEOUT)
        }

        // Report success
        if (totalReplacements > 0) {
            new Notice(
                `Replaced ${totalReplacements} expansion(s) across ${totalFiles} file(s)`,
                NOTICE_TIMEOUT
            )
        } else {
            new Notice('No expansions to replace in vault', NOTICE_TIMEOUT)
        }
    } catch (error) {
        log('Error replacing values in vault', 'error', error)
        new Notice(
            `Error replacing values: ${error instanceof Error ? error.message : 'Unknown error'}`,
            NOTICE_TIMEOUT
        )
    }
}
