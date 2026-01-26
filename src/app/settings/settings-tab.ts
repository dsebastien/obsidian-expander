import { App, PluginSettingTab, Setting } from 'obsidian'
import type { ExpanderPlugin } from '../plugin'
import { renderReplacementList } from './components/replacement-list'

/**
 * Settings tab for the Expander plugin
 */
export class ExpanderSettingTab extends PluginSettingTab {
    plugin: ExpanderPlugin

    constructor(app: App, plugin: ExpanderPlugin) {
        super(app, plugin)
        this.plugin = plugin
    }

    display(): void {
        const { containerEl } = this
        containerEl.empty()

        // Header
        containerEl.createEl('h2', { text: 'Expander Settings' })

        // Replacement definitions
        const replacementContainer = containerEl.createDiv({ cls: 'exp-settings-section' })
        renderReplacementList({
            containerEl: replacementContainer,
            replacements: this.plugin.settings.replacements,
            onSave: (replacements) => {
                // Save without re-render
                this.plugin.updateSettings((draft) => {
                    draft.replacements = replacements
                })
            },
            onStructuralChange: (replacements) => {
                // Save and re-render for add/delete/reorder
                this.plugin.updateSettings((draft) => {
                    draft.replacements = replacements
                })
                this.display()
            }
        })

        // Folder settings
        this.renderFolderSettings(containerEl)

        // Behavior settings
        this.renderBehaviorSettings(containerEl)

        // Actions
        this.renderActions(containerEl)

        // Support section
        this.renderSupportSection(containerEl)
    }

    private renderFolderSettings(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Folder settings').setHeading()

        new Setting(containerEl)
            .setName('Folders to scan')
            .setDesc(
                'Comma-separated list of folders to scan for expansions. Leave empty to scan all folders.'
            )
            .addTextArea((text) => {
                text.setPlaceholder('folder1, folder2/subfolder')
                    .setValue(this.plugin.settings.foldersToScan.join(', '))
                    .onChange((value) => {
                        const folders = value
                            .split(',')
                            .map((f) => f.trim())
                            .filter((f) => f.length > 0)
                        this.plugin.updateSettings((draft) => {
                            draft.foldersToScan = folders
                        })
                    })
                text.inputEl.classList.add('exp-folder-textarea')
            })

        new Setting(containerEl)
            .setName('Folders to ignore')
            .setDesc('Comma-separated list of folders to ignore during scanning.')
            .addTextArea((text) => {
                text.setPlaceholder('templates, archive')
                    .setValue(this.plugin.settings.ignoredFolders.join(', '))
                    .onChange((value) => {
                        const folders = value
                            .split(',')
                            .map((f) => f.trim())
                            .filter((f) => f.length > 0)
                        this.plugin.updateSettings((draft) => {
                            draft.ignoredFolders = folders
                        })
                    })
                text.inputEl.classList.add('exp-folder-textarea')
            })
    }

    private renderBehaviorSettings(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Behavior').setHeading()

        new Setting(containerEl)
            .setName('Disable automatic updates')
            .setDesc(
                'When enabled, expansions will only be updated via commands. When disabled, auto-mode expansions update on file change.'
            )
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.disableAutomaticUpdates).onChange((value) => {
                    this.plugin.updateSettings((draft) => {
                        draft.disableAutomaticUpdates = value
                    })
                })
            })

        new Setting(containerEl)
            .setName('Show refresh button')
            .setDesc('Show a refresh button next to expansion markers in the editor.')
            .addToggle((toggle) => {
                toggle.setValue(this.plugin.settings.showRefreshButton).onChange((value) => {
                    this.plugin.updateSettings((draft) => {
                        draft.showRefreshButton = value
                    })
                })
            })
    }

    private renderActions(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Actions').setHeading()

        new Setting(containerEl)
            .setName('Replace values in vault')
            .setDesc('Process all files and replace expansion values.')
            .addButton((button) => {
                button
                    .setButtonText('Replace values')
                    .setCta()
                    .onClick(() => {
                        // Execute the vault command
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        ;(this.app as any).commands.executeCommandById(
                            'obsidian-expander:replace-vault'
                        )
                    })
            })
    }

    private renderSupportSection(containerEl: HTMLElement): void {
        new Setting(containerEl).setName('Support').setHeading()

        new Setting(containerEl)
            .setName('Follow me on X')
            .setDesc('Sébastien Dubois (@dSebastien)')
            .addButton((button) => {
                button.setCta()
                button.setButtonText('Follow me on X').onClick(() => {
                    window.open('https://x.com/dSebastien')
                })
            })

        const supportDesc = new DocumentFragment()
        supportDesc.createDiv({
            text: 'Buy me a coffee to support the development of this plugin'
        })

        new Setting(containerEl).setDesc(supportDesc)

        this.renderBuyMeACoffeeBadge(containerEl)
        const spacing = containerEl.createDiv()
        spacing.classList.add('support-header-margin')
    }

    private renderBuyMeACoffeeBadge(contentEl: HTMLElement | DocumentFragment, width = 175): void {
        const linkEl = contentEl.createEl('a', {
            href: 'https://www.buymeacoffee.com/dsebastien'
        })
        const imgEl = linkEl.createEl('img')
        imgEl.src =
            'https://github.com/dsebastien/obsidian-plugin-template/blob/main/src/assets/buy-me-a-coffee.png?raw=true'
        imgEl.alt = 'Buy me a coffee'
        imgEl.width = width
    }
}
