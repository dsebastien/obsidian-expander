import { describe, expect, test } from 'bun:test'
import {
    createReplacementDraft,
    markReplacementDraftDirty,
    markReplacementDraftSaved,
    resetReplacementDraft,
    seedReplacementDraft
} from './replacement-draft'
import type { Replacement } from '../../types/plugin-settings.intf'

const committed: Replacement[] = [{ key: 'name', value: 'Ada', enabled: true }]

describe('replacement draft', () => {
    test('a first editor edits a copy of the committed list', () => {
        const draft = createReplacementDraft()
        const list = seedReplacementDraft(draft, committed)
        expect(list).toEqual(committed)
        list[0]!.value = 'changed'
        expect(committed[0]!.value).toBe('Ada')
    })

    test('a rebuilt editor gets the unsaved edits back, still dirty', () => {
        const draft = createReplacementDraft()
        const list = seedReplacementDraft(draft, committed)
        list[0]!.value = 'typed, not saved'
        markReplacementDraftDirty(draft)

        const rebuilt = seedReplacementDraft(draft, committed)
        expect(rebuilt[0]!.value).toBe('typed, not saved')
        expect(draft.dirty).toBe(true)
    })

    test('a clean draft is reseeded from committed settings', () => {
        const draft = createReplacementDraft()
        seedReplacementDraft(draft, committed)
        const newer: Replacement[] = [{ key: 'name', value: 'Grace', enabled: true }]
        expect(seedReplacementDraft(draft, newer)[0]!.value).toBe('Grace')
    })

    test('a save marks the draft clean only if nothing was typed meanwhile', () => {
        const draft = createReplacementDraft()
        seedReplacementDraft(draft, committed)
        markReplacementDraftDirty(draft)
        const atClick = draft.generation
        markReplacementDraftDirty(draft)
        markReplacementDraftSaved(draft, atClick)
        expect(draft.dirty).toBe(true)

        markReplacementDraftSaved(draft, draft.generation)
        expect(draft.dirty).toBe(false)
    })

    test('a reset draft starts over from committed settings', () => {
        const draft = createReplacementDraft()
        seedReplacementDraft(draft, committed)[0]!.value = 'typed'
        markReplacementDraftDirty(draft)
        resetReplacementDraft(draft)
        expect(draft.dirty).toBe(false)
        expect(seedReplacementDraft(draft, committed)[0]!.value).toBe('Ada')
    })
})
