# Expander Plugin Enhancement Ideas from Live Variables

## Overview

This document analyzes features from the [Live Variables](https://github.com/HamzaBenyazid/Live-variables) Obsidian plugin that could enhance our Expander plugin.

## Current Expander Capabilities

- Static text replacement via HTML comment markers
- Dynamic functions: `now()`, `today()`, `format()`, `lower()`, `upper()`, `trim()`, `replace()`
- Update modes: auto, manual, once, once-and-eject
- Folder filtering (include/exclude)
- Visual editor decorations (badges, refresh button)

## Interesting Features from Live Variables

### 1. Frontmatter Variables (High Value)

**Live Variables**: Defines variables in note YAML frontmatter, references them in content.

**Potential for Expander**: Add functions to read frontmatter values:

```
fm("key")                    → Read from current note's frontmatter
frontmatter("path/note", "key") → Read from another note's frontmatter
```

**Use Case**: Define project metadata in frontmatter, expand it throughout notes:

```yaml
---
project: My Project
version: 1.0.0
---
```

```markdown
<!-- expand: project-name -->fm("project")<!-- /expand: project-name -->
```

### 2. Cross-Note Variable References (High Value)

**Live Variables**: Variables from one note can be referenced in other notes.

**Potential for Expander**: Allow referencing expansions defined in other notes:

```
note("path/to/note.md", "key")  → Get expansion value from another note
```

**Use Case**: Centralized config note with all project variables:

```markdown
<!-- In config.md -->
<!-- expand: company-name -->Acme Corp<!-- /expand: company-name -->

<!-- In any other note -->

Company: <!-- expand: ref-company -->note("config.md", "company-name")<!-- /expand: ref-company -->
```

### 3. File Metadata Functions (Medium Value)

**Potential functions**:

```
filename()        → Current file name without extension
filepath()        → Full path relative to vault
created()         → File creation date (returns DateValue)
modified()        → File modification date (returns DateValue)
```

**Use Case**: Auto-insert file metadata:

```markdown
Created: <!-- expand: created-date -->created().format("YYYY-MM-DD")<!-- /expand: created-date -->
```

### 4. Built-in Calculation Functions (Lower Priority)

**Live Variables**: SUM and custom JavaScript execution.

**Potential for Expander**:

```
sum(1, 2, 3)      → 6
count("pattern")  → Count occurrences in file
```

_Note_: This adds significant complexity. Consider carefully if needed.

### 5. Smart Highlighting (Already Implemented)

**Live Variables**: Visual indicators for dynamic content.

**Expander**: Already has mode badges and refresh buttons. Could enhance with:

- Line highlighting for expansion markers
- Different visual treatment for resolved vs unresolved expansions

## Recommended Enhancements (Priority Order)

### Phase 1: File Metadata Functions

**Effort**: Low
**Value**: Medium
**Files to modify**: `function-evaluator.ts`

Add functions that don't require external context:

- `filename()` - Current file name
- `filepath()` - File path
- `created()` - Creation date
- `modified()` - Modification date

Requires passing file context to evaluator.

### Phase 2: Frontmatter Reading

**Effort**: Medium
**Value**: High
**Files to modify**: `function-evaluator.ts`, `expander.service.ts`

Add `fm("key")` function to read current note's frontmatter:

- Parse YAML frontmatter
- Return value for key or nested path
- Support default values: `fm("key", "default")`

### Phase 3: Cross-Note References

**Effort**: High
**Value**: High
**Files to modify**: `function-evaluator.ts`, `expander.service.ts`, `file-processor.service.ts`

Add `note("path", "key")` function:

- Resolve note path
- Read and parse target note
- Extract frontmatter or expansion value
- Handle circular references
- Cache results for performance

## Architecture Considerations

### Passing File Context

Current `evaluateValue(value: string)` has no file context. Options:

1. **Add optional context parameter**:

    ```typescript
    evaluateValue(value: string, context?: EvaluationContext): string

    interface EvaluationContext {
      file?: TFile
      app?: App
    }
    ```

2. **Create evaluation context class**:
    ```typescript
    class ExpressionEvaluator {
        constructor(
            private app: App,
            private file: TFile
        ) {}
        evaluate(expression: string): string
    }
    ```

### Frontmatter Parsing

Use Obsidian's built-in frontmatter parsing:

```typescript
const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter
const value = frontmatter?.[key]
```

### Cross-Note Resolution

```typescript
async function resolveNoteReference(app: App, path: string, key: string): Promise<string | null> {
    const file = app.vault.getAbstractFileByPath(path)
    if (!(file instanceof TFile)) return null

    const cache = app.metadataCache.getFileCache(file)
    return cache?.frontmatter?.[key] ?? null
}
```

## Implementation Plan

**Confirmed scope**: All three features with nested path support for frontmatter.

### Phase 1: Add Evaluation Context

**Files to modify**: `function-evaluator.ts`, `expander.service.ts`, `file-processor.service.ts`

1. Create `EvaluationContext` interface:

    ```typescript
    interface EvaluationContext {
        app: App
        file: TFile
    }
    ```

2. Update `evaluateValue()` signature:

    ```typescript
    evaluateValue(value: string, context?: EvaluationContext): string
    ```

3. Pass context through the call chain from file processor → expander service → function evaluator

### Phase 2: File Metadata Functions

**New functions in `function-evaluator.ts`**:

```typescript
// filename() → "My Note"
// filepath() → "folder/My Note.md"
// created() → DateValue (can chain .format())
// modified() → DateValue (can chain .format())
```

**Implementation**:

- Access `context.file.basename`, `context.file.path`
- Use `context.file.stat.ctime`, `context.file.stat.mtime` for dates
- Return DateValue for created/modified to allow formatting chain

### Phase 3: Frontmatter Reading

**New function**: `fm("key")` or `fm("key", "default")`

**Nested path support**: `fm("meta.author")` reads `frontmatter.meta.author`

**Implementation**:

```typescript
function evaluateFm(context: EvaluationContext, path: string, defaultValue?: string): string {
    const cache = context.app.metadataCache.getFileCache(context.file)
    const frontmatter = cache?.frontmatter
    if (!frontmatter) return defaultValue ?? ''

    // Handle nested paths: "meta.author" → frontmatter.meta.author
    const parts = path.split('.')
    let value: unknown = frontmatter
    for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
            value = (value as Record<string, unknown>)[part]
        } else {
            return defaultValue ?? ''
        }
    }
    return String(value ?? defaultValue ?? '')
}
```

### Phase 4: Cross-Note References

**New function**: `note("path/to/note.md", "frontmatter-key")`

**Implementation**:

```typescript
function evaluateNoteRef(context: EvaluationContext, notePath: string, key: string): string {
    // Resolve relative paths
    const resolvedPath = resolvePath(context.file.path, notePath)
    const file = context.app.vault.getAbstractFileByPath(resolvedPath)
    if (!(file instanceof TFile)) return ''

    const cache = context.app.metadataCache.getFileCache(file)
    const frontmatter = cache?.frontmatter
    if (!frontmatter) return ''

    // Support nested paths
    return getNestedValue(frontmatter, key) ?? ''
}
```

**Path resolution**: Support both absolute and relative paths:

- `note("config.md", "key")` - Absolute from vault root
- `note("./sibling.md", "key")` - Relative to current file
- `note("../parent/note.md", "key")` - Relative with parent

### Files to Create/Modify

| File                                         | Changes                               |
| -------------------------------------------- | ------------------------------------- |
| `src/app/types/evaluation-context.ts`        | New file: EvaluationContext interface |
| `src/app/services/function-evaluator.ts`     | Add context, new functions            |
| `src/app/services/expander.service.ts`       | Pass context to evaluator             |
| `src/app/services/file-processor.service.ts` | Pass context to service               |
| `src/app/utils/path-resolver.ts`             | New file: Path resolution utilities   |
| `docs/functions.md`                          | Document new functions                |

### Verification

1. **Unit tests** for:
    - Nested path resolution (`meta.author.name`)
    - File metadata extraction
    - Cross-note path resolution (relative, absolute)

2. **Manual testing**:
    - Create note with frontmatter, test `fm()` function
    - Test `filename()`, `filepath()`, `created()`, `modified()`
    - Create config note, reference from another note with `note()`
    - Test edge cases: missing frontmatter, invalid paths, circular refs

3. **Build and lint**:
    ```bash
    bun run tsc
    bun run lint
    bun test
    bun run build
    ```
