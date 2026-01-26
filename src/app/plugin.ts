import { Plugin, TFile } from 'obsidian'
import { DEFAULT_SETTINGS } from './types/plugin-settings.intf'
import type { PluginSettings } from './types/plugin-settings.intf'
import { ExpanderSettingTab } from './settings/settings-tab'
import { log } from '../utils/log'
import { produce } from 'immer'
import type { Draft } from 'immer'
import { ExpanderService } from './services/expander.service'
import { FileProcessorService } from './services/file-processor.service'
import { registerCommands } from './commands'
import { debounce } from '../utils/timing'
import { MINIMUM_MS_BETWEEN_EVENTS } from './constants'
import { createExpanderExtension } from './editor-extension'

/**
 * Expander plugin - replaces variables across the vault using HTML comment markers
 */
export class ExpanderPlugin extends Plugin {
    /**
     * The plugin settings are immutable
     */
    settings: PluginSettings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS)

    /**
     * Service for evaluating and managing expansions
     */
    expanderService!: ExpanderService

    /**
     * Service for processing files
     */
    fileProcessor!: FileProcessorService

    /**
     * Debounced handler for file modifications
     */
    private debouncedFileHandler = debounce((file: TFile) => {
        void this.handleFileModify(file)
    }, MINIMUM_MS_BETWEEN_EVENTS)

    /**
     * Executed as soon as the plugin loads
     */
    override async onload(): Promise<void> {
        log('Initializing', 'debug')
        await this.loadSettings()

        // Initialize services
        this.expanderService = new ExpanderService(() => this.settings)
        this.fileProcessor = new FileProcessorService(
            this.app,
            this.expanderService,
            () => this.settings
        )

        // Register commands
        registerCommands(this)

        // Register event handlers for automatic updates
        this.registerEventHandlers()

        // Register editor extension for decorations
        this.setupEditorExtension()

        // Add settings tab
        this.addSettingTab(new ExpanderSettingTab(this.app, this))

        log('Initialized', 'info')
    }

    override onunload(): void {
        this.debouncedFileHandler.cancel()
        log('Unloaded', 'debug')
    }

    /**
     * Set up the CodeMirror editor extension for decorations
     */
    private setupEditorExtension(): void {
        const extension = createExpanderExtension(
            this.app,
            () => this.settings,
            async (file: TFile, key: string) => {
                log(`Refreshing expansion "${key}" in ${file.path}`, 'debug')
                const success = await this.fileProcessor.processExpansion(file, key)
                if (success) {
                    log(`Refreshed expansion "${key}"`, 'debug')
                } else {
                    log(`Failed to refresh expansion "${key}"`, 'warn')
                }
            }
        )
        this.registerEditorExtension([extension])
    }

    /**
     * Register event handlers for automatic file processing
     */
    private registerEventHandlers(): void {
        // Handle file modifications
        this.registerEvent(
            this.app.vault.on('modify', (file) => {
                if (this.settings.disableAutomaticUpdates) {
                    return
                }

                if (file instanceof TFile && file.extension === 'md') {
                    if (this.fileProcessor.shouldProcessFile(file)) {
                        this.debouncedFileHandler(file)
                    }
                }
            })
        )
    }

    /**
     * Handle file modification - process auto-mode expansions
     */
    private async handleFileModify(file: TFile): Promise<void> {
        log(`File modified: ${file.path}`, 'debug')

        try {
            const result = await this.fileProcessor.processFile(file, 'auto')

            if (result.replacementsCount > 0) {
                log(`Replaced ${result.replacementsCount} expansion(s) in ${file.path}`, 'debug')
            }

            if (result.unknownKeys.length > 0) {
                log(`Unknown keys in ${file.path}: ${result.unknownKeys.join(', ')}`, 'warn')
            }
        } catch (error) {
            log(`Error processing file ${file.path}`, 'error', error)
        }
    }

    /**
     * Load the plugin settings
     */
    async loadSettings(): Promise<void> {
        log('Loading settings', 'debug')
        const loadedSettings = (await this.loadData()) as Partial<PluginSettings> | null

        if (!loadedSettings) {
            log('Using default settings', 'debug')
            this.settings = produce(DEFAULT_SETTINGS, () => DEFAULT_SETTINGS)
            return
        }

        this.settings = produce(DEFAULT_SETTINGS, (draft: Draft<PluginSettings>) => {
            // Merge loaded settings with defaults
            if (loadedSettings.replacements !== undefined) {
                draft.replacements = loadedSettings.replacements
            }
            if (loadedSettings.foldersToScan !== undefined) {
                draft.foldersToScan = loadedSettings.foldersToScan
            }
            if (loadedSettings.ignoredFolders !== undefined) {
                draft.ignoredFolders = loadedSettings.ignoredFolders
            }
            if (loadedSettings.disableAutomaticUpdates !== undefined) {
                draft.disableAutomaticUpdates = loadedSettings.disableAutomaticUpdates
            }
            if (loadedSettings.showRefreshButton !== undefined) {
                draft.showRefreshButton = loadedSettings.showRefreshButton
            }
        })

        log('Settings loaded', 'debug', this.settings)
    }

    /**
     * Update settings using an updater function (Immer pattern)
     */
    updateSettings(updater: (draft: Draft<PluginSettings>) => void): void {
        this.settings = produce(this.settings, updater)
        void this.saveSettings()
    }

    /**
     * Save the plugin settings
     */
    async saveSettings(): Promise<void> {
        log('Saving settings', 'debug', this.settings)
        await this.saveData(this.settings)
        log('Settings saved', 'debug')
    }
}
