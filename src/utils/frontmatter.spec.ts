import { describe, test, expect } from 'bun:test'
import {
    PROPERTY_PREFIX,
    isPropertyKey,
    getPropertyName,
    parseFrontmatter,
    updateFrontmatterProperty,
    getFrontmatterProperty
} from './frontmatter'

describe('PROPERTY_PREFIX', () => {
    test('has correct value', () => {
        expect(PROPERTY_PREFIX).toBe('prop.')
    })
})

describe('isPropertyKey', () => {
    test('returns true for keys starting with prop.', () => {
        expect(isPropertyKey('prop.foo')).toBe(true)
        expect(isPropertyKey('prop.created')).toBe(true)
        expect(isPropertyKey('prop.my-property')).toBe(true)
    })

    test('returns false for regular keys', () => {
        expect(isPropertyKey('foo')).toBe(false)
        expect(isPropertyKey('today')).toBe(false)
        expect(isPropertyKey('property')).toBe(false)
        expect(isPropertyKey('props.foo')).toBe(false)
    })

    test('returns false for empty string', () => {
        expect(isPropertyKey('')).toBe(false)
    })
})

describe('getPropertyName', () => {
    test('extracts property name from prop.* key', () => {
        expect(getPropertyName('prop.foo')).toBe('foo')
        expect(getPropertyName('prop.created')).toBe('created')
        expect(getPropertyName('prop.my-property')).toBe('my-property')
    })

    test('returns key unchanged if not a property key', () => {
        expect(getPropertyName('foo')).toBe('foo')
        expect(getPropertyName('today')).toBe('today')
    })
})

describe('parseFrontmatter', () => {
    test('parses simple frontmatter', () => {
        const content = `---
foo: bar
number: 42
---
Content here`

        const result = parseFrontmatter(content)
        expect(result).not.toBeNull()
        expect(result?.exists).toBe(true)
        expect(result?.data['foo']).toBe('bar')
        expect(result?.data['number']).toBe(42)
    })

    test('parses frontmatter with boolean values', () => {
        const content = `---
enabled: true
disabled: false
---
Content`

        const result = parseFrontmatter(content)
        expect(result?.data['enabled']).toBe(true)
        expect(result?.data['disabled']).toBe(false)
    })

    test('parses frontmatter with quoted strings', () => {
        const content = `---
name: "John Doe"
title: 'Hello World'
---
Content`

        const result = parseFrontmatter(content)
        expect(result?.data['name']).toBe('John Doe')
        expect(result?.data['title']).toBe('Hello World')
    })

    test('returns null for content without frontmatter', () => {
        const content = `# Title
Content without frontmatter`

        expect(parseFrontmatter(content)).toBeNull()
    })

    test('returns null for content not starting with ---', () => {
        const content = `Content
---
foo: bar
---`

        expect(parseFrontmatter(content)).toBeNull()
    })

    test('returns null for unclosed frontmatter', () => {
        const content = `---
foo: bar
Content without closing`

        expect(parseFrontmatter(content)).toBeNull()
    })

    test('handles empty frontmatter', () => {
        const content = `---
---
Content`

        const result = parseFrontmatter(content)
        expect(result).not.toBeNull()
        expect(result?.exists).toBe(true)
        expect(Object.keys(result?.data ?? {}).length).toBe(0)
    })

    test('skips comment lines', () => {
        const content = `---
# This is a comment
foo: bar
---
Content`

        const result = parseFrontmatter(content)
        expect(result?.data['foo']).toBe('bar')
        expect(result?.data['# This is a comment']).toBeUndefined()
    })

    test('calculates correct offsets', () => {
        const content = `---
foo: bar
---
Content here`

        const result = parseFrontmatter(content)
        expect(result?.startOffset).toBe(0)
        // Frontmatter is "---\nfoo: bar\n---" = 16 chars, then +4 for \n after closing ---
        // Actual: opening "---" (3) + "\n" (1) + "foo: bar" (8) + "\n" (1) = 13 for raw
        // endMatch is at position 12 (index of \n before closing ---), endOffset = 12 + 4 = 16
        expect(result?.endOffset).toBe(16)
    })
})

describe('updateFrontmatterProperty', () => {
    test('updates existing property', () => {
        const content = `---
foo: old
---
Content`

        const result = updateFrontmatterProperty(content, 'foo', 'new')
        expect(result).toContain('foo: new')
        expect(result).not.toContain('foo: old')
    })

    test('adds new property to existing frontmatter', () => {
        const content = `---
existing: value
---
Content`

        const result = updateFrontmatterProperty(content, 'new-prop', 'new-value')
        expect(result).toContain('existing: value')
        expect(result).toContain('new-prop: new-value')
    })

    test('creates frontmatter if none exists', () => {
        const content = `# Title
Content without frontmatter`

        const result = updateFrontmatterProperty(content, 'foo', 'bar')
        expect(result).toMatch(/^---\nfoo: bar\n---\n/)
        expect(result).toContain('# Title')
    })

    test('quotes values that need quoting', () => {
        const content = `---
existing: value
---
Content`

        // Value with colon needs quoting
        const result1 = updateFrontmatterProperty(content, 'time', '10:30')
        expect(result1).toContain('time: "10:30"')

        // Boolean-like string needs quoting
        const result2 = updateFrontmatterProperty(content, 'flag', 'true')
        expect(result2).toContain('flag: "true"')

        // Numeric string needs quoting
        const result3 = updateFrontmatterProperty(content, 'number', '42')
        expect(result3).toContain('number: "42"')
    })

    test('does not quote simple strings', () => {
        const content = `---
---
Content`

        const result = updateFrontmatterProperty(content, 'name', 'John')
        expect(result).toContain('name: John')
        expect(result).not.toContain('name: "John"')
    })

    test('preserves content after frontmatter', () => {
        const content = `---
foo: bar
---
# Title

Paragraph content`

        const result = updateFrontmatterProperty(content, 'foo', 'updated')
        expect(result).toContain('# Title')
        expect(result).toContain('Paragraph content')
    })

    test('handles empty value', () => {
        const content = `---
foo: bar
---
Content`

        const result = updateFrontmatterProperty(content, 'foo', '')
        expect(result).toContain('foo: ""')
    })
})

describe('getFrontmatterProperty', () => {
    test('returns property value', () => {
        const content = `---
foo: bar
number: 42
---
Content`

        expect(getFrontmatterProperty(content, 'foo')).toBe('bar')
        expect(getFrontmatterProperty(content, 'number')).toBe(42)
    })

    test('returns undefined for missing property', () => {
        const content = `---
foo: bar
---
Content`

        expect(getFrontmatterProperty(content, 'missing')).toBeUndefined()
    })

    test('returns undefined for content without frontmatter', () => {
        const content = `# Title
Content`

        expect(getFrontmatterProperty(content, 'foo')).toBeUndefined()
    })
})

describe('integration scenarios', () => {
    test('updates date property in note', () => {
        const content = `---
title: My Note
---
# My Note

Content here

<!-- expand: prop.updated -->2024-01-15<!---->`

        const result = updateFrontmatterProperty(content, 'updated', '2024-06-20')
        // Date format with hyphens doesn't need quoting in YAML
        expect(result).toContain('updated: 2024-06-20')
        expect(result).toContain('title: My Note')
        expect(result).toContain('<!-- expand: prop.updated -->')
    })

    test('creates frontmatter with date property', () => {
        const content = `# My Note

Content here

<!-- expand: prop.created --><!---->`

        const result = updateFrontmatterProperty(content, 'created', '2024-01-15')
        // Date format with hyphens doesn't need quoting in YAML
        expect(result).toMatch(/^---\ncreated: 2024-01-15\n---\n/)
        expect(result).toContain('# My Note')
    })

    test('multiple property updates', () => {
        let content = `---
title: My Note
---
Content`

        content = updateFrontmatterProperty(content, 'created', '2024-01-15')
        content = updateFrontmatterProperty(content, 'updated', '2024-06-20')

        expect(content).toContain('title: My Note')
        // Date format with hyphens doesn't need quoting in YAML
        expect(content).toContain('created: 2024-01-15')
        expect(content).toContain('updated: 2024-06-20')
    })
})
