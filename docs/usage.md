# Usage

## Comment Syntax

Expander uses HTML comments as markers to identify where to insert values. You can use just the opening tag:

```markdown
<!-- expand: key -->
```

The plugin will automatically add the value and closing tag, resulting in:

```markdown
<!-- expand: key -->value<!---->
```

- **Opening marker**: `<!-- expand: key -->` or variant
- **Value**: The content between markers (can be multi-line)
- **Closing marker**: `<!---->` (universal, same for all markers)

Whitespace around the key is flexible: `<!-- expand:key -->` and `<!-- expand:  key  -->` both work.

## Update Modes

Expander supports four update modes, each with a different marker prefix:

### Auto Mode (default)

```markdown
<!-- expand: my-key -->current value<!---->
```

- Updates automatically when the file is modified
- Best for values that should always stay current

### Manual Mode

```markdown
<!-- expand-manual: my-key -->current value<!---->
```

- Only updates via command or the refresh button
- Best for values you want to control explicitly

### Once Mode

```markdown
<!-- expand-once: my-key --><!---->
```

- Updates once when empty, then never again
- Best for values that should be set once (like creation dates)

### Once-and-Eject Mode

```markdown
<!-- expand-once-and-eject: my-key --><!---->
```

- Updates once, then removes the markers, leaving only the value
- Best for template insertions where you don't want markers to remain

## Multi-line Values

Values can span multiple lines:

```markdown
<!-- expand: signature -->

Best regards,
John Doe
john@example.com

<!---->
```

## Commands

### Replace values in current note

Process only the active file. Available from the command palette.

### Replace values in vault

Process all markdown files in configured folders. Available from the command palette and settings.

### Insert expansion

Opens a picker to select a key and update mode, then inserts the markers at the cursor position.

## Editor Decorations

When viewing a file with expansions, you'll see:

- **Mode badge**: Shows the update mode (auto, manual, once, eject) with a colored indicator
- **Refresh button**: Click to manually update a specific expansion

## Function Expressions

Replacement values can use function expressions for dynamic content. See [Functions](functions.md) for full reference.

### Date Functions

| Function             | Description           |
| -------------------- | --------------------- |
| `now()`              | Current date and time |
| `today()`            | Today at midnight     |
| `.format("pattern")` | Format a date         |

**Format patterns**: `YYYY` (year), `MM` (month), `DD` (day), `HH` (hour 24h), `mm` (minute), `ss` (second)

**Examples**:

```
now().format("YYYY-MM-DD")           → 2024-01-15
now().format("HH:mm")                → 14:30
today().format("MM/DD/YYYY")         → 01/15/2024
now().format("YYYY-MM-DD HH:mm:ss")  → 2024-01-15 14:30:45
```

### String Functions

| Function                             | Description                        |
| ------------------------------------ | ---------------------------------- |
| `upper("text")`                      | Convert to uppercase               |
| `lower("text")`                      | Convert to lowercase               |
| `trim("text")`                       | Remove leading/trailing whitespace |
| `replace("text", "find", "replace")` | Replace all occurrences            |

**Examples**:

```
upper("hello")                    → HELLO
lower("WORLD")                    → world
trim("  spaced  ")                → spaced
replace("a-b-c", "-", "_")        → a_b_c
```

### Chaining Functions

Functions can be chained together:

```
now().format("YYYY-MM-DD").replace("-", "/")  → 2024/01/15
upper("hello").replace("L", "X")              → HEXXO
now().format("MMMM").lower()                  → january
```

### Practical Examples

**Date stamp for notes**:

- Key: `today`
- Value: `now().format("YYYY-MM-DD")`

**Timestamp with time**:

- Key: `timestamp`
- Value: `now().format("YYYY-MM-DD HH:mm")`

**Uppercase project name**:

- Key: `project`
- Value: `upper("my project")`

**Formatted path**:

- Key: `path`
- Value: `replace("folder/subfolder/file", "/", " > ")`
