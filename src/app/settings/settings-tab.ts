import { Notice, PluginSettingTab } from 'obsidian'
import type { App, SearchComponent, SettingDefinitionItem } from 'obsidian'
import type { ExpanderPlugin } from '../plugin'
import type { Replacement } from '../types/plugin-settings.intf'
import { renderReplacementList } from './components/replacement-list'
import { FolderSuggest } from '../utils/folder-suggest'
import { BUY_ME_A_COFFEE_BADGE_DATA_URL } from '../assets/buy-me-a-coffee'
import { renderSupportSection } from '../ui/support-links'

/** The two folder lists, keyed by the settings field each one edits. */
type FolderListKey = 'foldersToScan' | 'ignoredFolders'

/**
 * Settings tab, declared rather than rendered (Obsidian 1.13+).
 *
 * `getSettingDefinitions()` REPLACES `display()`: when it returns a non-empty
 * array, `display()` is never called. There is no partial adoption — the whole
 * settings UI is declarative, or none of it. In exchange, Obsidian owns
 * navigation, focus and ARIA, and every declared `name`/`desc` is indexed by
 * the settings search.
 *
 * Rules that each cost a shipped bug somewhere in the plugin collection the
 * first time they were broken (see AGENTS.md "Declarative settings"):
 *
 * - A `render:` hook renders the ROW. Write into `setting.settingEl` only;
 *   anything written outside it (e.g. `group.listEl`) is the framework's to
 *   discard, and the control simply does not appear.
 * - `onDelete(index)` indexes the LIVE list. Resolve the entry from the live
 *   array at call time, never from a render-time snapshot.
 * - `setControlValue` MUST reject on failure, and validate before writing.
 *
 * The replacements editor keeps its draft-plus-Save semantics on purpose
 * (Sébastien's explicit decision): replacement keys are LIVE the moment they
 * are stored — a half-typed key persisted on every keystroke could match and
 * expand text in notes while the user is still typing it. Edits therefore stay
 * local until the Save button commits the validated list.
 */
export class ExpanderSettingTab extends PluginSettingTab {
    plugin: ExpanderPlugin

    constructor(app: App, plugin: ExpanderPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    override getSettingDefinitions(): SettingDefinitionItem[] {
        return [
            {
                name: 'Replacement definitions',
                desc: 'Define key-value pairs for expansion.',
                // The whole draft editor lives in one row: local edits, inline
                // validation, and the Save button that commits the list.
                render: (setting): void => {
                    setting.infoEl.remove() // the editor draws its own heading
                    // `.setting-item` is a flex ROW; the editor is a stack of
                    // full-width rows, so it needs block layout.
                    setting.settingEl.addClass('exp-settings-embed')
                    renderReplacementList({
                        containerEl: setting.settingEl,
                        replacements: this.plugin.settings.replacements,
                        onSave: (replacements) => this.saveReplacements(replacements),
                        onStructuralChange: (replacements): void => {
                            void (async (): Promise<void> => {
                                try {
                                    await this.saveReplacements(replacements)
                                } catch {
                                    new Notice('Failed to save settings.')
                                }
                                // Re-render so the list reflects the committed
                                // state (added/removed/reordered rows).
                                this.update()
                            })()
                        }
                    })
                }
            },
            // The folder lists stay at top level: a group's `items` accept
            // only plain definitions and pages, never a native `list`, so the
            // old "Folder scanning" section heading is carried by the two
            // labeled rows instead (same shape as the dataview-serializer
            // port).
            ...this.folderListDefinitions(
                'foldersToScan',
                'Folders to scan',
                'Folders to scan for expansions. Leave empty to scan all folders.'
            ),
            ...this.folderListDefinitions(
                'ignoredFolders',
                'Folders to ignore',
                'Folders to ignore during scanning.'
            ),
            {
                type: 'group',
                heading: 'Behavior',
                items: [
                    {
                        name: 'Disable automatic updates',
                        desc: 'When enabled, expansions will only be updated via commands. When disabled, auto-mode expansions update on file change.',
                        control: { type: 'toggle', key: 'disableAutomaticUpdates' }
                    },
                    {
                        name: 'Show refresh button',
                        desc: 'Show a refresh button next to expansion markers in the editor.',
                        control: { type: 'toggle', key: 'showRefreshButton' }
                    }
                ]
            },
            {
                type: 'group',
                heading: 'Actions',
                items: [
                    {
                        name: 'Replace values in vault',
                        desc: 'Process all files and replace expansion values.',
                        // A CTA button, not a row `action:`. `action:` makes
                        // the WHOLE row clickable and draws no button at all.
                        render: (setting): void => {
                            setting.addButton((button) => {
                                button
                                    .setButtonText('Replace values')
                                    .setCta()
                                    .onClick(() => {
                                        const app = this.app as unknown as {
                                            commands: {
                                                executeCommandById: (id: string) => boolean
                                            }
                                        }
                                        app.commands.executeCommandById('expander:replace-vault')
                                    })
                            })
                        }
                    }
                ]
            },
            {
                type: 'group',
                // No heading: renderSupportSection draws its own.
                items: [
                    {
                        name: 'Support',
                        // Not a setting — keep it out of the settings search.
                        searchable: false,
                        render: (setting): void => {
                            setting.infoEl.remove() // the section draws its own headings
                            // `.setting-item` is a flex ROW. The support block
                            // is a stack of full-width rows, so without this it
                            // would lay heading, buttons and badge side by side.
                            setting.settingEl.addClass('exp-settings-embed')
                            renderSupportSection(setting.settingEl, (el) => {
                                this.renderBuyMeACoffeeBadge(el)
                            })
                        }
                    }
                ]
            }
        ]
    }

    /**
     * Commit a validated replacement list.
     *
     * Extracted from the editor's Save button so the write can be tested
     * without a DOM. The editor validates before calling; this only persists.
     */
    async saveReplacements(replacements: Replacement[]): Promise<void> {
        await this.plugin.updateSettings((draft) => {
            draft.replacements = replacements
        })
    }

    /**
     * Append a folder to one of the lists.
     *
     * Extracted from the add button so the write can be tested without a DOM.
     * Trims and deduplicates, preserving the previous tab's behavior. Returns
     * whether anything was written, so the caller knows whether to clear its
     * input.
     */
    async addFolder(key: FolderListKey, raw: string): Promise<boolean> {
        const folder = raw.trim()
        if (folder === '') {
            return false
        }
        // Check against the COMMITTED list inside the mutator: the write chain
        // runs each mutation against the previously committed state, and
        // deciding out here would capture a pre-await snapshot — two quick
        // additions would each build on the same base, the second silently
        // dropping the first.
        let added = false
        await this.plugin.updateSettings((draft) => {
            if (draft[key].includes(folder)) {
                return
            }
            draft[key] = [...draft[key], folder]
            added = true
        })
        return added
    }

    /**
     * One folder list: a header row carrying the description and the
     * add-a-folder control, then the entries as a native list.
     *
     * The add control stays an inline search box with folder autocomplete
     * rather than the framework's `addItem` affordance, because `addItem`
     * hands back a bare element and the whole point here is the
     * `FolderSuggest` completion the old tab had.
     */
    private folderListDefinitions(
        key: FolderListKey,
        name: string,
        desc: string
    ): SettingDefinitionItem[] {
        return [
            {
                name,
                desc,
                render: (setting): void => {
                    let searchInput: SearchComponent | undefined
                    setting.addSearch((cb) => {
                        searchInput = cb
                        new FolderSuggest(cb.inputEl, this.app)
                        cb.setPlaceholder('Example: folder1/folder2')
                    })
                    setting.addButton((cb) => {
                        cb.setIcon('plus')
                        cb.setTooltip('Add folder')
                        cb.onClick(() => {
                            const raw = searchInput?.getValue() ?? ''
                            void (async (): Promise<void> => {
                                if (await this.addFolder(key, raw)) {
                                    searchInput?.setValue('')
                                }
                                this.update()
                            })()
                        })
                    })
                }
            },
            {
                type: 'list',
                emptyState: 'No folders configured.',
                // The framework hands back a position into the list as it was
                // DRAWN. Resolve the entry to a value here, while that position
                // is still meaningful, then filter INSIDE the mutator against
                // the committed array. Filtering a snapshot captured out here
                // would let two quick deletions each write a stale whole array,
                // resurrecting the entry the other one removed.
                onDelete: (index: number): void => {
                    const target = this.plugin.settings[key][index]
                    if (target === undefined) {
                        return
                    }
                    void (async (): Promise<void> => {
                        await this.plugin.updateSettings((draft) => {
                            draft[key] = draft[key].filter((value) => value !== target)
                        })
                        this.update()
                    })()
                },
                items: this.plugin.settings[key].map((folder) => ({
                    name: folder,
                    // Entries are data, not settings: keep them out of search.
                    searchable: false
                }))
            }
        ]
    }

    /**
     * Reads the value behind a control `key`. Returning undefined/null makes
     * the framework fall back to the control's declared `defaultValue`.
     */
    override getControlValue(key: string): unknown {
        switch (key) {
            case 'disableAutomaticUpdates':
                return this.plugin.settings.disableAutomaticUpdates
            case 'showRefreshButton':
                return this.plugin.settings.showRefreshButton
            default:
                return undefined
        }
    }

    /**
     * Persists a control edit. Rejecting (not resolving) on failure is what
     * lets the framework roll the control back to the stored truth.
     *
     * No side effects to sequence here: both flags are read live at use time —
     * the file-modify handler checks `disableAutomaticUpdates` per event, and
     * the editor extension reads `showRefreshButton` per decoration build.
     */
    override async setControlValue(key: string, value: unknown): Promise<void> {
        switch (key) {
            case 'disableAutomaticUpdates': {
                const next = this.expectBoolean(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.disableAutomaticUpdates = next
                })
                return
            }
            case 'showRefreshButton': {
                const next = this.expectBoolean(key, value)
                await this.plugin.updateSettings((draft) => {
                    draft.showRefreshButton = next
                })
                return
            }
            default:
                new Notice('Failed to save settings.')
                throw new Error(`Setting "${key}" does not address a known field.`)
        }
    }

    /** Rejects rather than coerces: a bad value must not reach the store. */
    private expectBoolean(key: string, value: unknown): boolean {
        if (typeof value !== 'boolean') {
            throw new Error(`Setting "${key}" expects a boolean.`)
        }
        return value
    }

    renderBuyMeACoffeeBadge(contentEl: HTMLElement | DocumentFragment, width = 175): void {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src = BUY_ME_A_COFFEE_BADGE_DATA_URL
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}
