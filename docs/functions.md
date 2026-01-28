# Functions

Expander supports function expressions for dynamic values. Functions can be chained together.

## Quick Reference

| Function                             | Description                    | Example                                 |
| ------------------------------------ | ------------------------------ | --------------------------------------- |
| `now()`                              | Current date/time              | `now().format("YYYY-MM-DD")`            |
| `today()`                            | Today at midnight              | `today().format("YYYY-MM-DD")`          |
| `date("string")`                     | Parse date from string         | `date("2024-01-15").format("YYYY")`     |
| `.format("pattern")`                 | Format a date                  | `now().format("HH:mm")`                 |
| `upper("text")` or `.upper()`        | Convert to uppercase           | `upper("hello")` or `file.name.upper()` |
| `lower("text")` or `.lower()`        | Convert to lowercase           | `lower("HELLO")` or `file.name.lower()` |
| `trim("text")` or `.trim()`          | Remove leading/trailing spaces | `trim("  text  ")`                      |
| `replace("text", "find", "replace")` | Replace all occurrences        | `replace("a-b", "-", "_")`              |
| `file.name`                          | File name (no extension)       | `file.name.upper()`                     |
| `file.path`                          | Full vault path                | `file.path.replace("/", " > ")`         |
| `file.folder`                        | Parent folder                  | `file.folder`                           |
| `file.ext`                           | File extension                 | `file.ext`                              |
| `file.ctime`                         | Creation date                  | `file.ctime.format("YYYY-MM-DD")`       |
| `file.mtime`                         | Modification date              | `file.mtime.format("YYYY-MM-DD")`       |

## File Fields

Access metadata about the current file using `file.*` fields:

| Field         | Description                  | Type   |
| ------------- | ---------------------------- | ------ |
| `file.name`   | File name without extension  | String |
| `file.path`   | Full path relative to vault  | String |
| `file.folder` | Parent folder path           | String |
| `file.ext`    | File extension (without dot) | String |
| `file.ctime`  | Creation time                | Date   |
| `file.mtime`  | Modification time            | Date   |

**Examples**:

```
file.name                           → "My Note"
file.path                           → "folder/My Note.md"
file.folder                         → "folder"
file.ctime.format("YYYY-MM-DD")     → "2024-01-15"
file.mtime.format("HH:mm")          → "14:30"
```

**With string functions**:

```
file.name.upper()                   → "MY NOTE"
upper(file.name)                    → "MY NOTE"
file.path.replace("/", " > ")       → "folder > My Note.md"
```

## Date Functions

### now()

Returns the current date and time.

```
now()
```

### today()

Returns today's date with time set to 00:00:00.

```
today()
```

### date(string)

Parses a date from a string. Supports various formats:

- ISO format: `2024-01-15`
- Slash format: `2024/01/15`
- Compact format: `20240115`
- Extracts dates from longer strings: `2024-01-15 Meeting Notes`

```
date("2024-01-15")
date(file.name)
```

### format(pattern)

Formats a date using a pattern string. Must be chained after `now()` or `today()`.

```
now().format("YYYY-MM-DD")
today().format("MM/DD/YYYY")
```

**Pattern tokens**:
| Token | Output | Example |
|-------|--------|---------|
| YYYY | 4-digit year | 2024 |
| YY | 2-digit year | 24 |
| MM | Month (zero-padded) | 01-12 |
| M | Month | 1-12 |
| DD | Day (zero-padded) | 01-31 |
| D | Day | 1-31 |
| HH | Hour 24h (zero-padded) | 00-23 |
| H | Hour 24h | 0-23 |
| hh | Hour 12h (zero-padded) | 01-12 |
| h | Hour 12h | 1-12 |
| mm | Minute (zero-padded) | 00-59 |
| m | Minute | 0-59 |
| ss | Second (zero-padded) | 00-59 |
| s | Second | 0-59 |
| A | AM/PM | AM, PM |
| a | am/pm | am, pm |

## String Functions

String functions take a text argument and can be chained.

### upper(text)

Converts string to uppercase.

```
upper("hello")
```

Result: `HELLO`

### lower(text)

Converts string to lowercase.

```
lower("HELLO")
```

Result: `hello`

### trim(text)

Removes leading and trailing whitespace.

```
trim("  hello  ")
```

Result: `hello`

### replace(text, pattern, replacement)

Replaces all occurrences of a pattern with a replacement string.

```
replace("hello world", "world", "there")
```

Result: `hello there`

### Chaining with dates

String functions can be chained after date functions:

```
now().format("MMMM").upper()
```

Result: `JANUARY`

## Examples

**Current date in ISO format**:

```
now().format("YYYY-MM-DD")
```

Result: `2024-01-15`

**Current time**:

```
now().format("HH:mm")
```

Result: `14:30`

**Date with slashes**:

```
now().format("YYYY-MM-DD").replace("-", "/")
```

Result: `2024/01/15`

**Today's date, midnight**:

```
today().format("YYYY-MM-DD HH:mm:ss")
```

Result: `2024-01-15 00:00:00`

**Uppercase text**:

```
upper("hello world")
```

Result: `HELLO WORLD`

**Chained string operations**:

```
upper("hello").replace("L", "X")
```

Result: `HEXXO`

**Parse date from string**:

```
date("2024-01-15").format("YYYY")
```

Result: `2024`

**Extract year from file name** (for a file named "2024-01-15 Meeting Notes"):

```
date(file.name).format("YYYY")
```

Result: `2024`

**Reformat a date**:

```
date("2024-01-15").format("DD/MM/YYYY")
```

Result: `15/01/2024`

## Chaining Examples

Functions can be chained in various combinations:

**Date + String chaining**:

```
now().format("YYYY-MM-DD").replace("-", "/")
```

Result: `2024/01/15`

**Multiple string operations**:

```
trim("  hello world  ").upper().replace(" ", "_")
```

Result: `HELLO_WORLD`

**File field + multiple operations**:

```
file.name.lower().replace(" ", "-")
```

Result: `my-note-title`

**Parse date from file name and reformat**:

```
date(file.name).format("DD/MM/YYYY")
```

Result: `15/01/2024` (for a file named "2024-01-15 Meeting")

## Syntax Variations

String functions support two equivalent syntaxes:

**Function syntax** (text as first argument):

```
upper("hello")
lower("HELLO")
trim("  text  ")
replace("a-b-c", "-", "_")
```

**Method syntax** (chained after a value):

```
file.name.upper()
file.name.lower()
file.name.trim()
file.path.replace("/", " > ")
```

Both syntaxes can be combined:

```
upper(file.name).replace(" ", "-")
```

Result: `MY-NOTE-TITLE`
