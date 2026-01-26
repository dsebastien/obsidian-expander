import { Notice, TFile } from 'obsidian'
import type { ExpanderPlugin } from '../plugin'
import { NOTICE_TIMEOUT } from '../constants'
import { log } from '../../utils/log'

/**
 * Register the "Replace values in current note" command
 */
export function registerReplaceCurrentNoteCommand(plugin: ExpanderPlugin): void {
    plugin.addCommand({
        id: 'replace-current-note',
        name: 'Replace values in current note',
        checkCallback: (checking: boolean) => {
            const activeFile = plugin.app.workspace.getActiveFile()

            if (!activeFile || !(activeFile instanceof TFile)) {
                return false
            }

            if (activeFile.extension !== 'md') {
                return false
            }

            if (checking) {
                return true
            }

            void replaceInCurrentNote(plugin, activeFile)
            return true
        }
    })
}

/**
 * Execute replacement in the current note
 */
async function replaceInCurrentNote(plugin: ExpanderPlugin, file: TFile): Promise<void> {
    log(`Replacing values in current note: ${file.path}`, 'info')

    try {
        const result = await plugin.fileProcessor.processFile(file, 'all')

        if (result.errors.length > 0) {
            new Notice(
                `Errors processing ${file.basename}: ${result.errors.join(', ')}`,
                NOTICE_TIMEOUT
            )
            return
        }

        if (result.unknownKeys.length > 0) {
            log(`Unknown keys in ${file.path}: ${result.unknownKeys.join(', ')}`, 'warn')
            new Notice(`Unknown keys: ${result.unknownKeys.join(', ')}`, NOTICE_TIMEOUT)
        }

        if (result.replacementsCount > 0) {
            new Notice(
                `Replaced ${result.replacementsCount} expansion(s) in ${file.basename}`,
                NOTICE_TIMEOUT
            )
        } else {
            new Notice(`No expansions to replace in ${file.basename}`, NOTICE_TIMEOUT)
        }
    } catch (error) {
        log(`Error replacing values in current note`, 'error', error)
        new Notice(
            `Error replacing values: ${error instanceof Error ? error.message : 'Unknown error'}`,
            NOTICE_TIMEOUT
        )
    }
}
