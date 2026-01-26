import { EditorView, Decoration, ViewPlugin, WidgetType } from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { RangeSetBuilder } from '@codemirror/state'
import type { App, TFile } from 'obsidian'
import type { PluginSettings } from './types/plugin-settings.intf'
import type { UpdateMode } from './constants'
import { findExpansions } from '../utils/regex'

/**
 * Icon SVGs for mode badges
 */
const ICONS = {
    auto: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>',
    manual: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0"></path><path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2"></path><path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8"></path><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"></path></svg>',
    once: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
    eject: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>',
    refresh:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>'
}

/**
 * Mode badge labels
 */
const MODE_LABELS: Record<UpdateMode, string> = {
    'auto': 'auto',
    'manual': 'manual',
    'once': 'once',
    'once-and-eject': 'eject'
}

/**
 * Widget for displaying mode badge and refresh button
 */
class ExpanderWidget extends WidgetType {
    constructor(
        private key: string,
        private mode: UpdateMode,
        private showRefreshButton: boolean,
        private onRefresh: () => void
    ) {
        super()
    }

    toDOM(): HTMLElement {
        const container = document.createElement('span')
        container.className = 'exp-widgets'

        // Mode badge
        const badge = document.createElement('span')
        const modeClass = this.mode === 'once-and-eject' ? 'eject' : this.mode
        badge.className = `exp-badge exp-badge-${modeClass}`

        const icon = document.createElement('span')
        icon.className = 'exp-badge-icon'
        icon.innerHTML = ICONS[modeClass === 'eject' ? 'eject' : modeClass] ?? ICONS.auto

        const label = document.createElement('span')
        label.textContent = MODE_LABELS[this.mode]

        badge.appendChild(icon)
        badge.appendChild(label)
        container.appendChild(badge)

        // Refresh button
        if (this.showRefreshButton) {
            const refreshBtn = document.createElement('button')
            refreshBtn.className = 'exp-refresh-button'
            refreshBtn.title = `Refresh "${this.key}"`
            refreshBtn.innerHTML = ICONS.refresh
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.onRefresh()
            })
            container.appendChild(refreshBtn)
        }

        return container
    }

    override eq(other: ExpanderWidget): boolean {
        return (
            this.key === other.key &&
            this.mode === other.mode &&
            this.showRefreshButton === other.showRefreshButton
        )
    }
}

/**
 * Create the expander editor extension
 */
export function createExpanderExtension(
    app: App,
    getSettings: () => PluginSettings,
    onRefresh: (file: TFile, key: string) => Promise<void>
): Extension {
    return ViewPlugin.fromClass(
        class {
            decorations: DecorationSet

            constructor(view: EditorView) {
                this.decorations = this.buildDecorations(view)
            }

            update(update: ViewUpdate): void {
                if (update.docChanged || update.viewportChanged) {
                    this.decorations = this.buildDecorations(update.view)
                }
            }

            buildDecorations(view: EditorView): DecorationSet {
                const settings = getSettings()
                const builder = new RangeSetBuilder<Decoration>()
                const text = view.state.doc.toString()

                const matches = findExpansions(text)

                for (const match of matches) {
                    // Find the line containing the closing marker
                    const closingMarkerStart = text.indexOf(match.closeMarker, match.startOffset)
                    if (closingMarkerStart === -1) continue

                    const closingMarkerEnd = closingMarkerStart + match.closeMarker.length

                    // Add widget decoration after closing marker
                    const widget = new ExpanderWidget(
                        match.key,
                        match.updateMode,
                        settings.showRefreshButton,
                        () => {
                            const activeFile = app.workspace.getActiveFile()
                            if (activeFile) {
                                void onRefresh(activeFile, match.key)
                            }
                        }
                    )

                    builder.add(
                        closingMarkerEnd,
                        closingMarkerEnd,
                        Decoration.widget({
                            widget,
                            side: 1
                        })
                    )
                }

                return builder.finish()
            }
        },
        {
            decorations: (v) => v.decorations
        }
    )
}
