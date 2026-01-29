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

**Exception**: Keys starting with `prop.` (e.g., `prop.updated`) only update frontmatter properties — no value is inserted and no closing marker is added. See [Property Keys](#property-keys-prop) for details.

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

| Function             | Description                  |
| -------------------- | ---------------------------- |
| `now()`              | Current date and time        |
| `today()`            | Today at midnight            |
| `date("string")`     | Parse date from string       |
| `.format("pattern")` | Format a date                |
| `.date()`            | Remove time component        |
| `.time()`            | Extract time as HH:mm:ss     |
| `.relative()`        | Human-readable relative time |

**Format patterns**: `YYYY` (year), `MM` (month), `DD` (day), `HH` (hour 24h), `mm` (minute), `ss` (second)

**Examples**:

```
now().format("YYYY-MM-DD")           → 2024-01-15
now().format("HH:mm")                → 14:30
today().format("MM/DD/YYYY")         → 01/15/2024
now().format("YYYY-MM-DD HH:mm:ss")  → 2024-01-15 14:30:45
date("2024-01-15").format("YYYY")    → 2024
date(file.name).format("DD/MM/YYYY") → 15/01/2024
now().time()                         → 14:30:45
file.mtime.relative()                → 3 days ago
```

### String Functions

| Function                             | Description                        |
| ------------------------------------ | ---------------------------------- |
| `upper("text")`                      | Convert to uppercase               |
| `lower("text")`                      | Convert to lowercase               |
| `title("text")`                      | Convert to Title Case              |
| `trim("text")`                       | Remove leading/trailing whitespace |
| `replace("text", "find", "replace")` | Replace all occurrences            |
| `.slice(start, end?)`                | Extract substring                  |
| `.repeat(n)`                         | Repeat string N times              |
| `.reverse()`                         | Reverse characters                 |
| `.split(sep, limit?)`                | Split to array                     |

**Boolean methods** (return `true`/`false`):

| Function                | Description             |
| ----------------------- | ----------------------- |
| `.startsWith(query)`    | Test string beginning   |
| `.endsWith(query)`      | Test string ending      |
| `.contains(value)`      | Test substring presence |
| `.containsAll(...vals)` | All substrings present  |
| `.containsAny(...vals)` | Any substring present   |
| `.isEmpty()`            | Check if empty          |

**Examples**:

```
upper("hello")                    → HELLO
lower("WORLD")                    → world
title("hello world")              → Hello World
trim("  spaced  ")                → spaced
replace("a-b-c", "-", "_")        → a_b_c
upper("hello").slice(0, 3)        → HEL
"ab".repeat(3)                    → ababab
file.name.contains("draft")       → true/false
```

### Number Functions

| Function               | Description            |
| ---------------------- | ---------------------- |
| `number("value")`      | Parse string to number |
| `min(val1, val2, ...)` | Get minimum value      |
| `max(val1, val2, ...)` | Get maximum value      |
| `.abs()`               | Absolute value         |
| `.ceil()`              | Round up               |
| `.floor()`             | Round down             |
| `.round(digits?)`      | Round to precision     |
| `.toFixed(precision)`  | Format decimals        |

**Examples**:

```
number("-5").abs()         → 5
number("3.7").ceil()       → 4
number("3.7").floor()      → 3
number("3.14159").round(2) → 3.14
min(5, 3, 8)               → 3
max(5, 3, 8)               → 8
```

### Conditional Function

| Function                      | Description       |
| ----------------------------- | ----------------- |
| `if(condition, true, false?)` | Conditional value |

**Examples**:

```
if("true", "yes", "no")                        → yes
if("", "yes", "no")                            → no
if(file.name.contains("draft"), "DRAFT", "")   → DRAFT (if filename contains "draft")
```

### Utility Functions

| Function           | Description            |
| ------------------ | ---------------------- |
| `escapeHTML(text)` | Escape HTML characters |

**Examples**:

```
escapeHTML("<div>")  → &lt;div&gt;
```

### Chaining Functions

Functions can be chained together:

```
now().format("YYYY-MM-DD").replace("-", "/")  → 2024/01/15
upper("hello").replace("L", "X")              → HEXXO
now().format("MMMM").lower()                  → january
file.name.title().replace(" ", "-")           → My-Note-Title
number("-3.7").abs().ceil()                   → 4
```

### File Fields

Access current file metadata with `file.*`:

| Field         | Description              |
| ------------- | ------------------------ |
| `file.name`   | File name (no extension) |
| `file.path`   | Full path                |
| `file.folder` | Parent folder            |
| `file.ext`    | Extension                |
| `file.ctime`  | Creation date            |
| `file.mtime`  | Modified date            |

**Examples**:

```
file.name                        → My Note
file.ctime.format("YYYY-MM-DD")  → 2024-01-15
file.name.upper()                → MY NOTE
upper(file.name)                 → MY NOTE
```

### Practical Examples

**Date stamp for notes**:

- Key: `today`
- Value: `now().format("YYYY-MM-DD")`

**Timestamp with time**:

- Key: `timestamp`
- Value: `now().format("YYYY-MM-DD HH:mm")`

**File name in uppercase**:

- Key: `title`
- Value: `file.name.upper()`

**File creation date**:

- Key: `created`
- Value: `file.ctime.format("YYYY-MM-DD")`

**Breadcrumb path**:

- Key: `breadcrumb`
- Value: `file.path.replace("/", " > ")`

**Year from file name** (for dated notes like "2024-01-15 Meeting"):

- Key: `year`
- Value: `date(file.name).format("YYYY")`

**Title case file name**:

- Key: `title`
- Value: `file.name.title()`

**Relative modification time**:

- Key: `last-modified`
- Value: `file.mtime.relative()`

**Draft indicator** (shows "DRAFT" if filename contains "draft"):

- Key: `status`
- Value: `if(file.name.contains("draft"), "DRAFT", "Published")`

**Current time only**:

- Key: `time`
- Value: `now().time()`

### Property Keys (prop.\*)

Keys starting with `prop.` are special — they **only update frontmatter properties** without inserting any text into the document. No closing marker is needed.

```markdown
<!-- expand: prop.updated -->
```

When triggered, this updates the `updated` frontmatter property but leaves the marker unchanged (no closing tag, no value inserted). The mode badge and refresh button are still displayed.

**Auto-update modification date**:

- Key: `prop.updated`
- Value: `now().format("YYYY-MM-DD")`

**Set creation date once**:

- Key: `prop.created`
- Value: `now().format("YYYY-MM-DD")`
- Use with `once` mode: `<!-- expand-once: prop.created -->`

**Sync title from file name**:

- Key: `prop.title`
- Value: `file.name`
