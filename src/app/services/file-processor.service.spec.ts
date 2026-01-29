import { describe, test, expect } from 'bun:test'
import { FileProcessorService } from './file-processor.service'
import type { App } from 'obsidian'
import type { ExpanderService } from './expander.service'
import type { PluginSettings } from '../types/plugin-settings.intf'
import type { EvaluationContext } from '../types/evaluation-context'

// Mock ExpanderService
function createMockExpanderService(replacements: Record<string, string>): ExpanderService {
    return {
        getReplacementValue: (key: string, _context?: EvaluationContext) => {
            return replacements[key] ?? null
        },
        hasKey: (key: string) => key in replacements,
        getEnabledKeys: () => Object.keys(replacements),
        getAllReplacements: () =>
            Object.entries(replacements).map(([key, value]) => ({
                key,
                value,
                enabled: true
            })),
        getReplacement: (key: string) => {
            if (key in replacements) {
                return { key, value: replacements[key]!, enabled: true }
            }
            return undefined
        },
        previewValue: (value: string) => ({ success: true, result: value })
    } as ExpanderService
}

// Mock App (minimal)
const mockApp = {} as App

// Default settings
const defaultSettings: PluginSettings = {
    replacements: [],
    foldersToScan: [],
    ignoredFolders: [],
    disableAutomaticUpdates: false,
    showRefreshButton: true
}

describe('FileProcessorService', () => {
    describe('replaceExpansions - smart incomplete expansion detection', () => {
        test('should add closing marker without duplicating value when text already matches', () => {
            const expanderService = createMockExpanderService({ foo: 'bar' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: foo -->bar'
            const result = processor.replaceExpansions(content, 'all')

            expect(result.newContent).toBe('<!-- expand: foo -->bar<!---->')
            expect(result.replacementsCount).toBe(1)
        })

        test('should insert value when text does not match (preserves trailing text)', () => {
            const expanderService = createMockExpanderService({ foo: 'bar' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: foo -->wrong'
            const result = processor.replaceExpansions(content, 'all')

            // Value is inserted with closing marker, trailing text preserved
            expect(result.newContent).toBe('<!-- expand: foo -->bar<!---->wrong')
            expect(result.replacementsCount).toBe(1)
        })

        test('should add value and closing marker when no text after marker', () => {
            const expanderService = createMockExpanderService({ foo: 'bar' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: foo -->'
            const result = processor.replaceExpansions(content, 'all')

            expect(result.newContent).toBe('<!-- expand: foo -->bar<!---->')
            expect(result.replacementsCount).toBe(1)
        })

        test('should handle partial match correctly (not a full match)', () => {
            const expanderService = createMockExpanderService({ foo: 'bar' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            // "ba" is a prefix of "bar" but not the full value, so insert full value
            const content = '<!-- expand: foo -->ba'
            const result = processor.replaceExpansions(content, 'all')

            // Value is inserted with closing marker, partial text preserved after
            expect(result.newContent).toBe('<!-- expand: foo -->bar<!---->ba')
            expect(result.replacementsCount).toBe(1)
        })

        test('should handle value with trailing content after it', () => {
            const expanderService = createMockExpanderService({ foo: 'bar' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            // Value "bar" is present, followed by more content
            const content = '<!-- expand: foo -->bar and more text'
            const result = processor.replaceExpansions(content, 'all')

            // Should add closing marker after "bar", preserving "and more text"
            expect(result.newContent).toBe('<!-- expand: foo -->bar<!----> and more text')
            expect(result.replacementsCount).toBe(1)
        })

        test('should handle multiline values', () => {
            const expanderService = createMockExpanderService({
                sig: 'Best,\nJohn'
            })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: sig -->Best,\nJohn'
            const result = processor.replaceExpansions(content, 'all')

            expect(result.newContent).toBe('<!-- expand: sig -->Best,\nJohn<!---->')
            expect(result.replacementsCount).toBe(1)
        })

        test('should handle empty replacement value', () => {
            const expanderService = createMockExpanderService({ foo: '' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: foo -->'
            const result = processor.replaceExpansions(content, 'all')

            expect(result.newContent).toBe('<!-- expand: foo --><!---->')
            expect(result.replacementsCount).toBe(1)
        })

        test('should handle unknown keys by adding closing marker only', () => {
            const expanderService = createMockExpanderService({})
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: unknown -->existing'
            const result = processor.replaceExpansions(content, 'all')

            // Unknown key: add closing marker right after opening marker
            expect(result.newContent).toBe('<!-- expand: unknown --><!---->existing')
            expect(result.unknownKeys).toContain('unknown')
        })

        test('should not modify prop.* incomplete expansions (no closing marker)', () => {
            const expanderService = createMockExpanderService({ 'prop.foo': 'bar' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: prop.foo -->'
            const result = processor.replaceExpansions(content, 'all')

            // prop.* keys don't get closing markers
            expect(result.newContent).toBe('<!-- expand: prop.foo -->')
            expect(result.propertyUpdates).toHaveLength(1)
            expect(result.propertyUpdates[0]).toEqual({
                propertyName: 'foo',
                value: 'bar'
            })
        })
    })

    describe('replaceExpansions - complete expansions', () => {
        test('should update value in complete expansion', () => {
            const expanderService = createMockExpanderService({ foo: 'new-value' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: foo -->old-value<!---->'
            const result = processor.replaceExpansions(content, 'all')

            expect(result.newContent).toBe('<!-- expand: foo -->new-value<!---->')
            expect(result.replacementsCount).toBe(1)
        })

        test('should not change content when value matches', () => {
            const expanderService = createMockExpanderService({ foo: 'same' })
            const processor = new FileProcessorService(
                mockApp,
                expanderService,
                () => defaultSettings
            )

            const content = '<!-- expand: foo -->same<!---->'
            const result = processor.replaceExpansions(content, 'all')

            expect(result.newContent).toBeNull()
            expect(result.replacementsCount).toBe(0)
        })
    })
})
