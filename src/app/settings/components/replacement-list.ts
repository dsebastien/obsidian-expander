import { Setting } from 'obsidian'
import type { Replacement } from '../../types/plugin-settings.intf'
import { validateKey } from '../../utils/validate-key'
import { isFunctionExpression, evaluateValue } from '../../services/function-evaluator'

/**
 * Props for the replacement list component
 */
interface ReplacementListProps {
    containerEl: HTMLElement
    replacements: Replacement[]
    onUpdate: (replacements: Replacement[]) => void
}

/**
 * Render the replacement list component
 */
export function renderReplacementList(props: ReplacementListProps): void {
    const { containerEl, replacements, onUpdate } = props

    // Header
    new Setting(containerEl).setName('Replacement definitions').setHeading()

    new Setting(containerEl).setDesc(
        'Define key-value pairs for expansion. Keys must be kebab-case (lowercase letters, numbers, hyphens). ' +
            'Values can be static text or function expressions like now().format("YYYY-MM-DD").'
    )

    // Add new replacement button
    new Setting(containerEl).addButton((button) => {
        button
            .setButtonText('Add replacement')
            .setCta()
            .onClick(() => {
                const newReplacement: Replacement = {
                    key: '',
                    value: '',
                    enabled: true
                }
                onUpdate([...replacements, newReplacement])
            })
    })

    // List of replacements
    const listEl = containerEl.createDiv({ cls: 'exp-replacement-list' })

    for (let i = 0; i < replacements.length; i++) {
        const replacement = replacements[i]
        if (!replacement) continue

        renderReplacementItem(listEl, replacement, i, replacements, onUpdate)
    }
}

/**
 * Render a single replacement item
 */
function renderReplacementItem(
    containerEl: HTMLElement,
    replacement: Replacement,
    index: number,
    allReplacements: Replacement[],
    onUpdate: (replacements: Replacement[]) => void
): void {
    const itemEl = containerEl.createDiv({ cls: 'exp-replacement-item' })

    // Key input row
    const keyRow = new Setting(itemEl).setName('Key').setClass('exp-replacement-key-row')

    const keyErrorEl = itemEl.createDiv({ cls: 'exp-key-error' })

    keyRow.addText((text) => {
        text.setPlaceholder('my-key')
            .setValue(replacement.key)
            .onChange((value) => {
                const updated = [...allReplacements]
                const item = updated[index]
                if (item) {
                    item.key = value
                    onUpdate(updated)
                }

                // Validate key
                const error = validateKey(value)
                if (error) {
                    keyErrorEl.textContent = error
                    keyErrorEl.classList.add('visible')
                    text.inputEl.classList.add('exp-input-error')
                } else {
                    // Check for duplicate keys
                    const isDuplicate = allReplacements.some(
                        (r, idx) => idx !== index && r.key === value
                    )
                    if (isDuplicate) {
                        keyErrorEl.textContent = 'Key already exists'
                        keyErrorEl.classList.add('visible')
                        text.inputEl.classList.add('exp-input-error')
                    } else {
                        keyErrorEl.textContent = ''
                        keyErrorEl.classList.remove('visible')
                        text.inputEl.classList.remove('exp-input-error')
                    }
                }
            })

        // Initial validation
        if (replacement.key) {
            const error = validateKey(replacement.key)
            if (error) {
                keyErrorEl.textContent = error
                keyErrorEl.classList.add('visible')
                text.inputEl.classList.add('exp-input-error')
            }
        }
    })

    // Value input row
    const valueRow = new Setting(itemEl).setName('Value').setClass('exp-replacement-value-row')

    const valuePreviewEl = itemEl.createDiv({ cls: 'exp-value-preview' })

    valueRow.addTextArea((text) => {
        text.setPlaceholder('Static value or now().format("YYYY-MM-DD")')
            .setValue(replacement.value)
            .onChange((value) => {
                const updated = [...allReplacements]
                const item = updated[index]
                if (item) {
                    item.value = value
                    onUpdate(updated)
                }

                updateValuePreview(value, valuePreviewEl)
            })

        text.inputEl.classList.add('exp-value-textarea')

        // Initial preview
        updateValuePreview(replacement.value, valuePreviewEl)
    })

    // Controls row (toggle + delete)
    const controlsRow = new Setting(itemEl).setClass('exp-replacement-controls')

    controlsRow
        .addToggle((toggle) => {
            toggle.setValue(replacement.enabled).onChange((value) => {
                const updated = [...allReplacements]
                const item = updated[index]
                if (item) {
                    item.enabled = value
                    onUpdate(updated)
                }
            })
        })
        .addExtraButton((button) => {
            button
                .setIcon('trash')
                .setTooltip('Delete replacement')
                .onClick(() => {
                    const updated = allReplacements.filter((_, idx) => idx !== index)
                    onUpdate(updated)
                })
        })

    // Move up/down buttons
    if (index > 0) {
        controlsRow.addExtraButton((button) => {
            button
                .setIcon('arrow-up')
                .setTooltip('Move up')
                .onClick(() => {
                    const updated = [...allReplacements]
                    const prev = updated[index - 1]
                    const current = updated[index]
                    if (prev && current) {
                        updated[index - 1] = current
                        updated[index] = prev
                        onUpdate(updated)
                    }
                })
        })
    }

    if (index < allReplacements.length - 1) {
        controlsRow.addExtraButton((button) => {
            button
                .setIcon('arrow-down')
                .setTooltip('Move down')
                .onClick(() => {
                    const updated = [...allReplacements]
                    const next = updated[index + 1]
                    const current = updated[index]
                    if (next && current) {
                        updated[index + 1] = current
                        updated[index] = next
                        onUpdate(updated)
                    }
                })
        })
    }
}

/**
 * Update the value preview element
 */
function updateValuePreview(value: string, previewEl: HTMLElement): void {
    if (!value) {
        previewEl.textContent = ''
        previewEl.classList.remove('visible')
        return
    }

    if (isFunctionExpression(value)) {
        try {
            const result = evaluateValue(value)
            previewEl.textContent = `Preview: ${result}`
            previewEl.classList.add('visible')
            previewEl.classList.remove('exp-preview-error')
        } catch {
            previewEl.textContent = 'Error evaluating expression'
            previewEl.classList.add('visible', 'exp-preview-error')
        }
    } else {
        previewEl.textContent = ''
        previewEl.classList.remove('visible')
    }
}
