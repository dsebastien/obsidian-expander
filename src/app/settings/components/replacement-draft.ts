import type { Replacement } from '../../types/plugin-settings.intf'
import { validateKey } from '../../../utils/validation'

/**
 * The replacements editor's unsaved draft, kept by the settings tab so it
 * outlives the editor.
 *
 * `update()` removes and rebuilds the editor after any structural change or
 * folder add/remove. Seeded from committed settings, the rebuilt editor would
 * silently drop every unsaved field edit; seeded from this draft, it shows
 * them again, still dirty, with Save still available.
 */
export interface ReplacementDraft {
    /** The list being edited; null until an editor has been seeded. */
    replacements: Replacement[] | null
    /** Whether the draft holds edits that are not committed. */
    dirty: boolean
    /**
     * Bumped on every edit. A Save captures it at click time and marks the
     * draft clean only if no edit landed while the write was in flight.
     */
    generation: number
    /**
     * The write in flight, if any. ONE latch for Save and structural edits
     * (add/delete/move) alike, shared across editor rebuilds: a Save queued
     * behind a pending delete would otherwise write the deleted key back
     * (and keys are live once stored), and a rebuilt editor would offer a
     * second write while the first is still pending.
     */
    pending: 'save' | 'structural' | null
    /** Refreshes the live editor's Save button; set by each editor. */
    refresh: (() => void) | null
}

export function createReplacementDraft(): ReplacementDraft {
    return { replacements: null, dirty: false, generation: 0, pending: null, refresh: null }
}

/**
 * The list a (re)built editor edits: the unsaved draft when there is one,
 * otherwise a fresh copy of the committed list. The draft keeps a reference
 * to the returned list, which the editor mutates in place.
 */
export function seedReplacementDraft(
    draft: ReplacementDraft,
    committed: readonly Replacement[]
): Replacement[] {
    if (draft.dirty && draft.replacements !== null) {
        return draft.replacements
    }
    draft.replacements = committed.map((replacement) => ({ ...replacement }))
    return draft.replacements
}

export function markReplacementDraftDirty(draft: ReplacementDraft): void {
    draft.dirty = true
    draft.generation += 1
}

/** After a Save landed: clean, unless an edit arrived while it was in flight. */
export function markReplacementDraftSaved(draft: ReplacementDraft, savedGeneration: number): void {
    if (draft.generation === savedGeneration) {
        draft.dirty = false
    }
}

/**
 * Why a structural edit must not be written, or null when it may.
 *
 * A structural edit persists the whole list, unsaved field edits included,
 * and replacement keys are live the moment they are stored. So the same
 * rule as Save applies to every key that could match: valid and unique. An
 * empty key is allowed (it matches nothing): it is how a new row starts.
 */
export function structuralChangeProblem(updated: readonly Replacement[]): string | null {
    const seen = new Set<string>()
    for (const { key } of updated) {
        if (key.trim() === '') {
            continue
        }
        const error = validateKey(key)
        if (error) {
            return `Fix the key "${key}" first: ${error}`
        }
        if (seen.has(key)) {
            return `Fix the duplicate key "${key}" first.`
        }
        seen.add(key)
    }
    return null
}

/** Forget the draft: the next editor starts from committed settings. */
export function resetReplacementDraft(draft: ReplacementDraft): void {
    draft.replacements = null
    draft.dirty = false
}
