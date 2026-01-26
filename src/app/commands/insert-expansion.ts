import { Editor, FuzzySuggestModal, Notice } from 'obsidian'
import type { ExpanderPlugin } from '../plugin'
import type { UpdateMode } from '../constants'
import {
    MODE_TO_OPEN_MARKER,
    MODE_TO_END_MARKER,
    EXPANDER_CLOSE,
    EXPANDER_END_SUFFIX
} from '../constants'
import { log } from '../../utils/log'

interface ExpansionOption {
    key: string
    value: string
}

interface ModeOption {
    mode: UpdateMode
    label: string
    description: string
}

const MODE_OPTIONS: ModeOption[] = [
    { mode: 'auto', label: 'Auto', description: 'Updates automatically on file changes' },
    { mode: 'manual', label: 'Manual', description: 'Only updates via command or button' },
    { mode: 'once', label: 'Once', description: 'Updates once, then never again' },
    { mode: 'once-and-eject', label: 'Once & Eject', description: 'Updates once, removes markers' }
]

/**
 * Modal for selecting an expansion key
 */
class ExpansionSelectModal extends FuzzySuggestModal<ExpansionOption> {
    private onSelect: (option: ExpansionOption) => void

    constructor(
        private plugin: ExpanderPlugin,
        onSelect: (option: ExpansionOption) => void
    ) {
        super(plugin.app)
        this.onSelect = onSelect
        this.setPlaceholder('Select an expansion key...')
    }

    getItems(): ExpansionOption[] {
        return this.plugin.expanderService
            .getAllReplacements()
            .filter((r) => r.enabled)
            .map((r) => ({ key: r.key, value: r.value }))
    }

    getItemText(item: ExpansionOption): string {
        return item.key
    }

    onChooseItem(item: ExpansionOption): void {
        this.onSelect(item)
    }
}

/**
 * Modal for selecting update mode
 */
class ModeSelectModal extends FuzzySuggestModal<ModeOption> {
    private onSelect: (option: ModeOption) => void

    constructor(plugin: ExpanderPlugin, onSelect: (option: ModeOption) => void) {
        super(plugin.app)
        this.onSelect = onSelect
        this.setPlaceholder('Select update mode...')
    }

    getItems(): ModeOption[] {
        return MODE_OPTIONS
    }

    getItemText(item: ModeOption): string {
        return `${item.label} - ${item.description}`
    }

    onChooseItem(item: ModeOption): void {
        this.onSelect(item)
    }
}

/**
 * Register the "Insert expansion" command
 */
export function registerInsertExpansionCommand(plugin: ExpanderPlugin): void {
    plugin.addCommand({
        id: 'insert-expansion',
        name: 'Insert expansion',
        editorCallback: (editor: Editor) => {
            insertExpansion(plugin, editor)
        }
    })
}

/**
 * Insert an expansion marker at the cursor position
 */
function insertExpansion(plugin: ExpanderPlugin, editor: Editor): void {
    const keys = plugin.expanderService.getEnabledKeys()

    if (keys.length === 0) {
        new Notice('No expansion keys configured. Add some in settings.')
        return
    }

    // First, select the key
    const keyModal = new ExpansionSelectModal(plugin, (keyOption) => {
        // Then, select the mode
        const modeModal = new ModeSelectModal(plugin, (modeOption) => {
            doInsert(editor, keyOption.key, modeOption.mode)
        })
        modeModal.open()
    })
    keyModal.open()
}

/**
 * Actually insert the markers at cursor position
 */
function doInsert(editor: Editor, key: string, mode: UpdateMode): void {
    log(`Inserting expansion: ${key} with mode ${mode}`, 'debug')

    const openMarker = MODE_TO_OPEN_MARKER[mode] + key + EXPANDER_CLOSE
    const closeMarker = MODE_TO_END_MARKER[mode] + key + EXPANDER_END_SUFFIX

    const cursor = editor.getCursor()
    const insertText = openMarker + closeMarker

    editor.replaceRange(insertText, cursor)

    // Position cursor between markers
    const newCursorPos = {
        line: cursor.line,
        ch: cursor.ch + openMarker.length
    }
    editor.setCursor(newCursorPos)
}
