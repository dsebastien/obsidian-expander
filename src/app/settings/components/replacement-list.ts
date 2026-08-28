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
    /**
     * Persists the list. Resolves when the write has landed; rejects when it
     * has not — the Save button reports success only on resolution, so the
     * "Settings saved" notice can never announce a write that failed.
     */
    onSave: (replacements: Replacement[]) => Promise<void>
    /**
     * Persists a structural edit (add/delete/move) and re-renders the editor.
     * Resolves after the write lands and the re-render is requested; rejects
     * when the write fails — the editor then keeps the current draft on
     * screen and releases its latch so the action can be retried.
     */
    onStructuralChange: (replacements: Replacement[]) => Promise<void>
}

/**
 * Deep clone replacements to create local mutable state
 */
function cloneReplacements(replacements: Replacement[]): Replacement[] {
    return replacements.map((r) => ({ ...r }))
}

/**
 * Validate all replacements and return whether the configuration is valid
 */
function validateReplacements(replacements: Replacement[]): boolean {
    const seenKeys = new Set<string>()

    for (const replacement of replacements) {
        // Check for empty keys
        if (!replacement.key || replacement.key.trim().length === 0) {
            return false
        }

        // Check for key validation errors
        const error = validateKey(replacement.key)
        if (error) {
            return false
        }

        // Check for duplicate keys
        if (seenKeys.has(replacement.key)) {
            return false
        }
        seenKeys.add(replacement.key)
    }

    return true
}

/**
 * Render the replacement list component
 */
export function renderReplacementList(props: ReplacementListProps): void {
    const { containerEl, replacements, onSave, onStructuralChange } = props

    // Local mutable state - changes here don't trigger re-renders
    const localReplacements = cloneReplacements(replacements)
    let hasUnsavedChanges = false

    // Counts edits; the Save handler captures it at click time so a keystroke
    // made while the write is in flight is not wrongly marked clean.
    let dirtyGeneration = 0

    // One save at a time: double-clicking a slow Save must not queue a second
    // write and a second (possibly contradictory) notice.
    let saveInFlight = false

    // One structural write at a time. Each structural action persists a
    // whole-list snapshot and the pane re-renders only after the write lands,
    // so a second action started from the still-visible OLD rows would write
    // a stale list (e.g. resurrecting an entry a pending delete removed).
    // The latch drops on failure; on success the re-render replaces the
    // whole editor anyway.
    let structuralActionPending = false

    // Track the save button for enabling/disabling
    let saveButtonEl: HTMLButtonElement | null = null

    /**
     * Update save button state based on changes and validation
     */
    const updateSaveButtonState = (): void => {
        if (!saveButtonEl) return

        const isValid = validateReplacements(localReplacements)

        if (hasUnsavedChanges && isValid && !saveInFlight) {
            saveButtonEl.disabled = false
            saveButtonEl.classList.add('mod-cta')
        } else {
            saveButtonEl.disabled = true
            saveButtonEl.classList.remove('mod-cta')
        }
    }

    const markDirty = (): void => {
        hasUnsavedChanges = true
        dirtyGeneration += 1
        updateSaveButtonState()
    }

    const markClean = (): void => {
        hasUnsavedChanges = false
        updateSaveButtonState()
    }

    /**
     * Persist a structural edit (add/delete/move). Serialized by the latch;
     * on failure the draft stays on screen and the action can be retried.
     */
    const requestStructuralChange = (updated: Replacement[]): void => {
        if (structuralActionPending) {
            return
        }
        structuralActionPending = true
        void onStructuralChange(updated).catch(() => {
            structuralActionPending = false
            new Notice('Failed to save settings.')
        })
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
            requestStructuralChange([...localReplacements, newReplacement])
        })
    })

    actionRow.addButton((button) => {
        saveButtonEl = button.buttonEl
        button.setButtonText('Save').onClick(() => {
            const isValid = validateReplacements(localReplacements)
            if (!hasUnsavedChanges || !isValid || saveInFlight) {
                return
            }
            saveInFlight = true
            updateSaveButtonState()
            // The generation captured here decides whether the draft may be
            // marked clean afterwards: a keystroke made while the write was
            // in flight was not part of the persisted snapshot and must keep
            // the draft dirty.
            const savedGeneration = dirtyGeneration
            // Mark clean only after the write lands; a failed persist keeps
            // the draft dirty so Save stays available to retry.
            void onSave(localReplacements)
                .then(() => {
                    if (dirtyGeneration === savedGeneration) {
                        markClean()
                    }
                    new Notice('Settings saved')
                })
                .catch(() => {
                    new Notice('Failed to save settings.')
                })
                .finally(() => {
                    saveInFlight = false
                    updateSaveButtonState()
                })
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
            // Item rows route structural edits through the latch too.
            onStructuralChange: requestStructuralChange
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
