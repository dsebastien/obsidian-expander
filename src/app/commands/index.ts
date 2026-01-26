import type { ExpanderPlugin } from '../plugin'
import { registerReplaceCurrentNoteCommand } from './replace-current-note'
import { registerReplaceVaultCommand } from './replace-vault'
import { registerInsertExpansionCommand } from './insert-expansion'

/**
 * Register all plugin commands
 */
export function registerCommands(plugin: ExpanderPlugin): void {
    registerReplaceCurrentNoteCommand(plugin)
    registerReplaceVaultCommand(plugin)
    registerInsertExpansionCommand(plugin)
}
