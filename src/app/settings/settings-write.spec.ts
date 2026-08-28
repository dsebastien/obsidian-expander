import { describe, expect, test, mock } from 'bun:test'
import { produce } from 'immer'
import { ExpanderPlugin } from '../plugin'
import { ExpanderSettingTab } from './settings-tab'
import { DEFAULT_SETTINGS } from '../types/plugin-settings.intf'
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
    await new Promise((resolve) => setTimeout(resolve, 10))
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
    internals['settings'] = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS)
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
