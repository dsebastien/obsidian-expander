import { describe, expect, test, mock } from 'bun:test'
import { produce } from 'immer'
import type { App, PluginManifest } from 'obsidian'
import { ExpanderPlugin } from '../plugin'
import { ExpanderSettingTab } from './settings-tab'
import { DEFAULT_SETTINGS, createDefaultSettings } from '../types/plugin-settings.intf'
import { createReplacementDraft, markReplacementDraftDirty } from './components/replacement-draft'
import type { ReplacementDraft } from './components/replacement-draft'
import type { PluginSettings, Replacement } from '../types/plugin-settings.intf'

/**
 * Behavioral coverage for the settings write path.
 *
 * `settings-guard.spec.ts` only scans source text, and nothing in CI renders a
 * settings pane. These tests exercise the properties no UI test can reach:
 * writes are serialized, memory is committed only after persistence succeeds,
 * and a rejected value never reaches the store.
 */

/** Lets the fire-and-forget writes the pane starts run to completion. */
async function settle(): Promise<void> {
    for (let i = 0; i < 20; i += 1) {
        await Promise.resolve()
    }
    await new Promise((resolve) => self.setTimeout(resolve, 10))
}

async function expectRejection(promise: Promise<unknown>, contains: string): Promise<void> {
    let caught: unknown
    await promise.catch((error: unknown) => {
        caught = error
    })
    expect(caught).toBeInstanceOf(Error)
    expect((caught as Error).message).toContain(contains)
}

interface Harness {
    plugin: ExpanderPlugin
    tab: ExpanderSettingTab
    saveData: ReturnType<typeof mock>
}

function createHarness(options?: { saveData?: () => Promise<void> }): Harness {
    const saveData = mock(async () => {
        if (options?.saveData) {
            await options.saveData()
        }
    })

    const plugin = Object.create(ExpanderPlugin.prototype) as ExpanderPlugin
    const internals = plugin as unknown as Record<string, unknown>
    internals['settings'] = produce(createDefaultSettings(), () => {})
    internals['settingsWriteChain'] = Promise.resolve()
    internals['saveData'] = saveData

    const tab = Object.create(ExpanderSettingTab.prototype) as ExpanderSettingTab
    const tabInternals = tab as unknown as Record<string, unknown>
    tabInternals['plugin'] = plugin
    tabInternals['update'] = () => {}

    return { plugin, tab, saveData }
}

describe('updateSettings', () => {
    test('commits to memory only after the write is persisted', async () => {
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        const { plugin, saveData } = createHarness({ saveData: () => gate })

        const pending = plugin.updateSettings((draft) => {
            draft.showRefreshButton = !DEFAULT_SETTINGS.showRefreshButton
        })

        // Let the queued write start and reach its save await; a bare
        // synchronous assertion would pass even with the ordering reversed,
        // because the chain defers the work to a microtask.
        await Promise.resolve()
        await Promise.resolve()
        expect(saveData).toHaveBeenCalledTimes(1)
        expect(plugin.settings.showRefreshButton).toBe(DEFAULT_SETTINGS.showRefreshButton)

        release()
        await pending
        expect(plugin.settings.showRefreshButton).toBe(!DEFAULT_SETTINGS.showRefreshButton)
    })

    test('leaves memory untouched when persistence fails', async () => {
        const { plugin } = createHarness({
            saveData: () => Promise.reject(new Error('disk full'))
        })

        await expectRejection(
            plugin.updateSettings((draft) => {
                draft.foldersToScan = ['Somewhere']
            }),
            'disk full'
        )

        expect(plugin.settings.foldersToScan).toEqual(DEFAULT_SETTINGS.foldersToScan)
    })

    test('overlapping writes do not drop each other', async () => {
        // Adding a folder and flipping a toggle are one click apart here, so
        // this is the realistic case, not a contrived one.
        let releaseFirst = (): void => {}
        const first = new Promise<void>((resolve) => {
            releaseFirst = resolve
        })
        let call = 0
        const { plugin } = createHarness({
            saveData: () => {
                call += 1
                return call === 1 ? first : Promise.resolve()
            }
        })

        const a = plugin.updateSettings((draft) => {
            draft.foldersToScan = ['Notes']
        })
        const b = plugin.updateSettings((draft) => {
            draft.disableAutomaticUpdates = true
        })

        releaseFirst()
        await Promise.all([a, b])

        expect(plugin.settings.foldersToScan).toEqual(['Notes'])
        expect(plugin.settings.disableAutomaticUpdates).toBe(true)
    })
})

describe('folder list writes', () => {
    /**
     * The folder lists sit flat at top level (a group cannot host a native
     * list); the first `list` definition is `foldersToScan`.
     */
    function firstFolderList(tab: ExpanderSettingTab): { onDelete?: (i: number) => void } {
        const defs = (
            tab as unknown as { getSettingDefinitions: () => Record<string, unknown>[] }
        ).getSettingDefinitions()
        return defs.find((d) => d['type'] === 'list') as {
            onDelete?: (i: number) => void
        }
    }

    test('blank input is refused, and folder names are trimmed and deduplicated', async () => {
        // Trimming and deduplication preserve the previous tab's behavior.
        const { plugin, tab } = createHarness()

        expect(await tab.addFolder('foldersToScan', '   ')).toBe(false)
        expect(await tab.addFolder('foldersToScan', '')).toBe(false)
        expect(await tab.addFolder('foldersToScan', ' Notes ')).toBe(true)
        expect(await tab.addFolder('foldersToScan', 'Notes')).toBe(false)

        expect(plugin.settings.foldersToScan).toEqual(['Notes'])
    })

    test('two quick additions through the pane both survive', async () => {
        let releaseFirst = (): void => {}
        const first = new Promise<void>((resolve) => {
            releaseFirst = resolve
        })
        let gating = false
        let call = 0
        const { plugin, tab } = createHarness({
            saveData: () => {
                if (!gating) {
                    return Promise.resolve()
                }
                call += 1
                return call === 1 ? first : Promise.resolve()
            }
        })
        gating = true

        const a = tab.addFolder('foldersToScan', 'A')
        const b = tab.addFolder('foldersToScan', 'B')
        releaseFirst()
        await Promise.all([a, b])

        expect(plugin.settings.foldersToScan).toContain('A')
        expect(plugin.settings.foldersToScan).toContain('B')
    })

    test('two quick deletions through the pane do not resurrect each other', async () => {
        // Goes through the tab's own onDelete, not updateSettings directly:
        // the historical bug was at the CALL SITE, filtering a pre-await
        // snapshot of the array rather than the committed draft.
        let releaseFirst = (): void => {}
        const first = new Promise<void>((resolve) => {
            releaseFirst = resolve
        })
        let gating = false
        let call = 0
        const { plugin, tab } = createHarness({
            saveData: () => {
                if (!gating) {
                    return Promise.resolve()
                }
                call += 1
                return call === 1 ? first : Promise.resolve()
            }
        })
        await plugin.updateSettings((draft) => {
            draft.foldersToScan = ['A', 'B']
        })
        gating = true

        const list = firstFolderList(tab)
        list.onDelete?.(0) // A
        list.onDelete?.(1) // B, by its position in the list as drawn
        await Promise.resolve()
        releaseFirst()
        await settle()

        expect(plugin.settings.foldersToScan).toEqual([])
    })

    test('onDelete resolves the entry by value, so a shifted index cannot delete the wrong one', async () => {
        const { plugin, tab } = createHarness()
        await plugin.updateSettings((draft) => {
            draft.foldersToScan = ['A', 'B', 'C']
        })

        const list = firstFolderList(tab)
        list.onDelete?.(1)
        await settle()

        expect(plugin.settings.foldersToScan).toEqual(['A', 'C'])
    })
})

describe('replacement list writes', () => {
    test('saveReplacements persists the committed list', async () => {
        const { plugin, tab } = createHarness()
        const replacements: Replacement[] = [
            { key: 'today', value: "now().format('YYYY-MM-DD')", enabled: true },
            { key: 'signature', value: '— Sébastien', enabled: false }
        ]

        await tab.saveReplacements(replacements)

        expect(plugin.settings.replacements).toEqual(replacements)
    })

    test('a failed persist leaves the stored list untouched', async () => {
        const { plugin, tab } = createHarness({
            saveData: () => Promise.reject(new Error('disk full'))
        })

        await expectRejection(
            tab.saveReplacements([{ key: 'today', value: 'x', enabled: true }]),
            'disk full'
        )

        expect(plugin.settings.replacements).toEqual(DEFAULT_SETTINGS.replacements)
    })

    test('the list is snapshotted at call time, so in-flight edits neither leak nor freeze', async () => {
        // The editor keeps mutating its draft objects while a write is
        // pending. Storing by reference would persist those post-click edits
        // unvalidated — and immer's auto-freeze on commit would freeze the
        // editor's live objects, silently breaking every later keystroke.
        let release = (): void => {}
        const gate = new Promise<void>((resolve) => {
            release = resolve
        })
        const { plugin, tab } = createHarness({ saveData: () => gate })

        const draft: Replacement[] = [{ key: 'today', value: 'x', enabled: true }]
        const pending = tab.saveReplacements(draft)

        // Edits made while the write is in flight, as the editor does.
        const draftItem = draft[0]
        if (draftItem) {
            draftItem.key = 'not-yet-valid-'
        }
        draft.push({ key: '', value: '', enabled: true })

        release()
        await pending

        expect(plugin.settings.replacements).toEqual([{ key: 'today', value: 'x', enabled: true }])
        expect(Object.isFrozen(draftItem)).toBe(false)
    })
})

describe('setControlValue', () => {
    test('rejects a wrongly typed value without writing', async () => {
        const { tab, plugin, saveData } = createHarness()

        await expectRejection(tab.setControlValue('showRefreshButton', 'yes'), 'boolean')
        expect(saveData).not.toHaveBeenCalled()
        expect(plugin.settings.showRefreshButton).toBe(DEFAULT_SETTINGS.showRefreshButton)
    })

    test('rejects an unknown key', async () => {
        const { tab, saveData } = createHarness()

        await expectRejection(tab.setControlValue('nope', true), 'known field')
        expect(saveData).not.toHaveBeenCalled()
    })

    test('persists every scalar control', async () => {
        const { tab, plugin } = createHarness()

        await tab.setControlValue(
            'disableAutomaticUpdates',
            !DEFAULT_SETTINGS.disableAutomaticUpdates
        )
        await tab.setControlValue('showRefreshButton', !DEFAULT_SETTINGS.showRefreshButton)

        expect(plugin.settings).toMatchObject({
            disableAutomaticUpdates: !DEFAULT_SETTINGS.disableAutomaticUpdates,
            showRefreshButton: !DEFAULT_SETTINGS.showRefreshButton
        })
    })

    test('getControlValue answers for every declared control key', () => {
        const { tab, plugin } = createHarness()
        const settings: PluginSettings = plugin.settings

        expect(tab.getControlValue('disableAutomaticUpdates')).toBe(
            settings.disableAutomaticUpdates
        )
        expect(tab.getControlValue('showRefreshButton')).toBe(settings.showRefreshButton)
        expect(tab.getControlValue('nope')).toBeUndefined()
    })
})

describe('replacement draft on the tab', () => {
    function withDraft(h: Harness): { draft: ReplacementDraft; updates: () => number } {
        const draft = createReplacementDraft()
        draft.replacements = [{ key: 'typed', value: 'x', enabled: true }]
        markReplacementDraftDirty(draft)
        let updates = 0
        const internals = h.tab as unknown as Record<string, unknown>
        internals['replacementDraft'] = draft
        internals['update'] = (): void => {
            updates += 1
        }
        return { draft, updates: () => updates }
    }

    test('a committed structural edit resets the draft and rebuilds the pane', async () => {
        const h = createHarness()
        const { draft, updates } = withDraft(h)
        await h.tab.commitStructuralChange([{ key: 'kept', value: 'y', enabled: true }])
        expect(h.plugin.settings.replacements.map((r) => r.key)).toEqual(['kept'])
        expect(draft.dirty).toBe(false)
        expect(draft.replacements).toBeNull()
        expect(updates()).toBe(1)
    })

    test('a failed structural edit keeps the unsaved draft and the pane as they are', async () => {
        const h = createHarness({ saveData: () => Promise.reject(new Error('disk full')) })
        const { draft, updates } = withDraft(h)
        await expectRejection(
            h.tab.commitStructuralChange([{ key: 'kept', value: 'y', enabled: true }]),
            'disk full'
        )
        expect(draft.dirty).toBe(true)
        expect(draft.replacements?.[0]?.key).toBe('typed')
        expect(updates()).toBe(0)
    })

    test('leaving the pane discards the unsaved draft', () => {
        const h = createHarness()
        const { draft } = withDraft(h)
        h.tab.hide()
        expect(draft.dirty).toBe(false)
        expect(draft.replacements).toBeNull()
    })
})

describe('default settings', () => {
    test('constructing the plugin never freezes the shared defaults', () => {
        const plugin = new ExpanderPlugin({} as App, {} as PluginManifest)
        expect(Object.isFrozen(plugin.settings)).toBe(true)
        expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(false)
        expect(Object.isFrozen(DEFAULT_SETTINGS.replacements)).toBe(false)
        expect(Object.isFrozen(DEFAULT_SETTINGS.foldersToScan)).toBe(false)
        expect(Object.isFrozen(DEFAULT_SETTINGS.ignoredFolders)).toBe(false)
    })

    test('loadSettings with no stored data never freezes the shared defaults', async () => {
        // Skip the constructor: its field initializer is the other test's case.
        const plugin = Object.assign(Object.create(ExpanderPlugin.prototype) as ExpanderPlugin, {
            settings: produce(createDefaultSettings(), () => {}),
            loadData: (): Promise<unknown> => Promise.resolve(null)
        })

        await plugin.loadSettings()

        // Immer deep-freezes what produce returns, including subtrees shared
        // with its base: producing from DEFAULT_SETTINGS froze the constant
        // for the rest of the process.
        expect(plugin.settings).toEqual(DEFAULT_SETTINGS)
        expect(Object.isFrozen(plugin.settings)).toBe(true)
        expect(Object.isFrozen(DEFAULT_SETTINGS)).toBe(false)
        expect(Object.isFrozen(DEFAULT_SETTINGS.replacements)).toBe(false)
    })

    test('loadSettings with partial stored data never freezes the shared defaults', async () => {
        const plugin = Object.assign(Object.create(ExpanderPlugin.prototype) as ExpanderPlugin, {
            settings: produce(createDefaultSettings(), () => {}),
            loadData: (): Promise<unknown> => Promise.resolve({ showRefreshButton: false })
        })

        await plugin.loadSettings()

        // The arrays the stored data leaves out are shared with the base.
        expect(plugin.settings.showRefreshButton).toBe(false)
        expect(plugin.settings.foldersToScan).toEqual([])
        expect(Object.isFrozen(DEFAULT_SETTINGS.replacements)).toBe(false)
        expect(Object.isFrozen(DEFAULT_SETTINGS.foldersToScan)).toBe(false)
        expect(Object.isFrozen(DEFAULT_SETTINGS.ignoredFolders)).toBe(false)
    })

    test('each default settings object is an independent copy', () => {
        const one = createDefaultSettings()
        one.foldersToScan.push('Somewhere')
        one.replacements.push({ key: 'k', value: 'v', enabled: true })
        expect(createDefaultSettings().foldersToScan).toEqual([])
        expect(createDefaultSettings().replacements).toEqual([])
        expect(DEFAULT_SETTINGS.foldersToScan).toEqual([])
    })
})
