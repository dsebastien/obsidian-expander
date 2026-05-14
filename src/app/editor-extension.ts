import { EditorView, Decoration, ViewPlugin, WidgetType } from '@codemirror/view'
import type { DecorationSet, ViewUpdate } from '@codemirror/view'
import type { Extension } from '@codemirror/state'
import { RangeSetBuilder } from '@codemirror/state'
import { setIcon } from 'obsidian'
import type { App, TFile } from 'obsidian'
import type { PluginSettings } from './types/plugin-settings.intf'
import type { UpdateMode } from './constants'
import { findExpansions, findIncompleteExpansions } from '../utils/regex'
import { isPropertyKey } from '../utils/frontmatter'

type BadgeMode = 'auto' | 'manual' | 'once' | 'eject'

const MODE_ICONS: Record<BadgeMode, string> = {
    auto: 'refresh-cw',
    manual: 'hand',
    once: 'clock',
    eject: 'log-out'
}

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
        const container = createSpan({ cls: 'exp-widgets' })

        const modeClass: BadgeMode = this.mode === 'once-and-eject' ? 'eject' : this.mode
        const badge = container.createSpan({ cls: `exp-badge exp-badge-${modeClass}` })

        const icon = badge.createSpan({ cls: 'exp-badge-icon' })
        setIcon(icon, MODE_ICONS[modeClass])

        badge.createSpan({ text: MODE_LABELS[this.mode] })

        if (this.showRefreshButton) {
            const refreshBtn = container.createEl('button', {
                cls: 'exp-refresh-button',
                attr: { 'aria-label': `Refresh "${this.key}"` }
            })
            setIcon(refreshBtn, 'refresh-cw')
            refreshBtn.addEventListener('click', (e) => {
                e.preventDefault()
                e.stopPropagation()
                this.onRefresh()
            })
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

                // Collect all decoration positions to add in order
                const decorations: Array<{ pos: number; key: string; mode: UpdateMode }> = []

                // Process complete expansions (with closing markers)
                const matches = findExpansions(text)
                for (const match of matches) {
                    // Find the line containing the closing marker
                    const closingMarkerStart = text.indexOf(match.closeMarker, match.startOffset)
                    if (closingMarkerStart === -1) continue

                    const closingMarkerEnd = closingMarkerStart + match.closeMarker.length
                    decorations.push({
                        pos: closingMarkerEnd,
                        key: match.key,
                        mode: match.updateMode
                    })
                }

                // Process incomplete prop.* expansions (no closing marker needed)
                const incomplete = findIncompleteExpansions(text)
                for (const inc of incomplete) {
                    if (isPropertyKey(inc.key)) {
                        decorations.push({
                            pos: inc.endOffset,
                            key: inc.key,
                            mode: inc.updateMode
                        })
                    }
                }

                // Sort by position (required by RangeSetBuilder)
                decorations.sort((a, b) => a.pos - b.pos)

                // Add all decorations
                for (const dec of decorations) {
                    const widget = new ExpanderWidget(
                        dec.key,
                        dec.mode,
                        settings.showRefreshButton,
                        () => {
                            const activeFile = app.workspace.getActiveFile()
                            if (activeFile) {
                                void onRefresh(activeFile, dec.key)
                            }
                        }
                    )

                    builder.add(
                        dec.pos,
                        dec.pos,
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
