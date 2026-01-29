import { Notice, Setting } from 'obsidian'
import type { Replacement } from '../../types/plugin-settings.intf'
import { validateKey } from '../../../utils/validation'
import { isFunctionExpression, evaluateValue } from '../../services/function-evaluator'
import { isPropertyKey, getPropertyName } from '../../../utils/frontmatter'

/**
 * Props for the replacement list component
 */
interface ReplacementListProps {
    containerEl: HTMLElement
    replacements: Replacement[]
    onSave: (replacements: Replacement[]) => void
    onStructuralChange: (replacements: Replacement[]) => void
}

/**
 * Deep clone replacements to create local mutable state
 */
function cloneReplacements(replacements: Replacement[]): Replacement[] {
    return replacements.map((r) => ({ ...r }))
}

/**
 * Render the replacement list component
 */
export function renderReplacementList(props: ReplacementListProps): void {
    const { containerEl, replacements, onSave, onStructuralChange } = props

    // Local mutable state - changes here don't trigger re-renders
    const localReplacements = cloneReplacements(replacements)
    let hasUnsavedChanges = false

    // Track the save button for enabling/disabling
    let saveButtonEl: HTMLButtonElement | null = null

    const markDirty = (): void => {
        hasUnsavedChanges = true
        if (saveButtonEl) {
            saveButtonEl.disabled = false
            saveButtonEl.classList.add('mod-cta')
        }
    }

    const markClean = (): void => {
        hasUnsavedChanges = false
        if (saveButtonEl) {
            saveButtonEl.disabled = true
            saveButtonEl.classList.remove('mod-cta')
        }
    }

    // Header
    new Setting(containerEl).setName('Replacement definitions').setHeading()

    new Setting(containerEl).setDesc(
        'Define key-value pairs for expansion. Keys must be kebab-case (lowercase letters, numbers, hyphens). ' +
            'Values can be static text or function expressions like now().format("YYYY-MM-DD"). ' +
            'Keys starting with "prop." (e.g., prop.updated) will also update the corresponding frontmatter property.'
    )

    // Action buttons row
    const actionRow = new Setting(containerEl)

    actionRow.addButton((button) => {
        button.setButtonText('Add replacement').onClick(() => {
            // Save current state first, then add new item
            const newReplacement: Replacement = {
                key: '',
                value: '',
                enabled: true
            }
            onStructuralChange([...localReplacements, newReplacement])
        })
    })

    actionRow.addButton((button) => {
        saveButtonEl = button.buttonEl
        button.setButtonText('Save').onClick(() => {
            if (hasUnsavedChanges) {
                onSave(localReplacements)
                markClean()
                new Notice('Settings saved')
            }
        })
        // Initially disabled
        button.buttonEl.disabled = true
    })

    // List of replacements
    const listEl = containerEl.createDiv({ cls: 'exp-replacement-list' })

    for (let i = 0; i < localReplacements.length; i++) {
        const replacement = localReplacements[i]
        if (!replacement) continue

        renderReplacementItem({
            containerEl: listEl,
            replacement,
            index: i,
            allReplacements: localReplacements,
            onFieldChange: markDirty,
            onStructuralChange
        })
    }
}

interface ReplacementItemProps {
    containerEl: HTMLElement
    replacement: Replacement
    index: number
    allReplacements: Replacement[]
    onFieldChange: () => void
    onStructuralChange: (replacements: Replacement[]) => void
}

/**
 * Render a single replacement item
 */
function renderReplacementItem(props: ReplacementItemProps): void {
    const { containerEl, replacement, index, allReplacements, onFieldChange, onStructuralChange } =
        props

    const itemEl = containerEl.createDiv({ cls: 'exp-replacement-item' })

    // Key input row
    const keyRow = new Setting(itemEl).setName('Key').setClass('exp-replacement-key-row')

    const keyErrorEl = itemEl.createDiv({ cls: 'exp-key-error' })
    const propertyIndicatorEl = itemEl.createDiv({ cls: 'exp-property-indicator' })

    const updatePropertyIndicator = (key: string): void => {
        if (isPropertyKey(key)) {
            const propName = getPropertyName(key)
            propertyIndicatorEl.textContent = `→ Updates frontmatter property: ${propName}`
            propertyIndicatorEl.classList.add('visible')
        } else {
            propertyIndicatorEl.textContent = ''
            propertyIndicatorEl.classList.remove('visible')
        }
    }

    keyRow.addText((text) => {
        text.setPlaceholder('my-key')
            .setValue(replacement.key)
            .onChange((value) => {
                // Update local state directly - no re-render
                replacement.key = value
                onFieldChange()

                // Update property indicator
                updatePropertyIndicator(value)

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
            // Initial property indicator
            updatePropertyIndicator(replacement.key)
        }
    })

    // Value input row
    const valueRow = new Setting(itemEl).setName('Value').setClass('exp-replacement-value-row')

    const valuePreviewEl = itemEl.createDiv({ cls: 'exp-value-preview' })

    valueRow.addTextArea((text) => {
        text.setPlaceholder('Static value or now().format("YYYY-MM-DD")')
            .setValue(replacement.value)
            .onChange((value) => {
                // Update local state directly - no re-render
                replacement.value = value
                onFieldChange()

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
                // Update local state directly - no re-render
                replacement.enabled = value
                onFieldChange()
            })
        })
        .addExtraButton((button) => {
            button
                .setIcon('trash')
                .setTooltip('Delete replacement')
                .onClick(() => {
                    const updated = allReplacements.filter((_, idx) => idx !== index)
                    onStructuralChange(updated)
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
                        onStructuralChange(updated)
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
                        onStructuralChange(updated)
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
