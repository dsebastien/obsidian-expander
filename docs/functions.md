# Functions

Expander supports function expressions for dynamic values. Functions can be chained together.

## Quick Reference

### Date Functions

| Function             | Description                  | Example                             |
| -------------------- | ---------------------------- | ----------------------------------- |
| `now()`              | Current date/time            | `now().format("YYYY-MM-DD")`        |
| `today()`            | Today at midnight            | `today().format("YYYY-MM-DD")`      |
| `date("string")`     | Parse date from string       | `date("2024-01-15").format("YYYY")` |
| `.format("pattern")` | Format a date                | `now().format("HH:mm")`             |
| `.date()`            | Remove time component        | `now().date().format("YYYY-MM-DD")` |
| `.time()`            | Extract time as HH:mm:ss     | `now().time()`                      |
| `.relative()`        | Human-readable relative time | `file.mtime.relative()`             |

### String Functions

| Function                             | Description                    | Example                                 |
| ------------------------------------ | ------------------------------ | --------------------------------------- |
| `upper("text")` or `.upper()`        | Convert to uppercase           | `upper("hello")` or `file.name.upper()` |
| `lower("text")` or `.lower()`        | Convert to lowercase           | `lower("HELLO")` or `file.name.lower()` |
| `title("text")` or `.title()`        | Title Case                     | `title("hello world")` → "Hello World"  |
| `trim("text")` or `.trim()`          | Remove leading/trailing spaces | `trim("  text  ")`                      |
| `replace("text", "find", "replace")` | Replace all occurrences        | `replace("a-b", "-", "_")`              |
| `.slice(start, end?)`                | Extract substring              | `"hello".slice(0, 3)` → "hel"           |
| `.repeat(n)`                         | Repeat string N times          | `"ab".repeat(3)` → "ababab"             |
| `.reverse()`                         | Reverse characters             | `"hello".reverse()` → "olleh"           |
| `.split(sep, limit?)`                | Split to array                 | `"a,b,c".split(",")` → "a, b, c"        |

### Boolean String Methods

| Function                        | Description             | Example                                 |
| ------------------------------- | ----------------------- | --------------------------------------- |
| `.startsWith(query)`            | Test string beginning   | `file.name.startsWith("2024")`          |
| `.endsWith(query)`              | Test string ending      | `file.name.endsWith("draft")`           |
| `.contains(value)`              | Test substring presence | `file.name.contains("daily")`           |
| `.containsAll(val1, val2, ...)` | All substrings present  | `file.name.containsAll("a", "b")`       |
| `.containsAny(val1, val2, ...)` | Any substring present   | `file.name.containsAny("draft", "wip")` |
| `.isEmpty()`                    | Empty check             | `file.name.isEmpty()`                   |

### Number Functions

| Function               | Description            | Example                               |
| ---------------------- | ---------------------- | ------------------------------------- |
| `number("value")`      | Parse string to number | `number("42").abs()`                  |
| `min(val1, val2, ...)` | Get minimum value      | `min(5, 3, 8)` → "3"                  |
| `max(val1, val2, ...)` | Get maximum value      | `max(5, 3, 8)` → "8"                  |
| `.abs()`               | Absolute value         | `number("-5").abs()` → "5"            |
| `.ceil()`              | Round up               | `number("3.2").ceil()` → "4"          |
| `.floor()`             | Round down             | `number("3.9").floor()` → "3"         |
| `.round(digits?)`      | Round to precision     | `number("3.14159").round(2)` → "3.14" |
| `.toFixed(precision)`  | Format decimals        | `number("3").toFixed(2)` → "3.00"     |

### Conditional Function

| Function                      | Description       | Example                           |
| ----------------------------- | ----------------- | --------------------------------- |
| `if(condition, true, false?)` | Conditional value | `if("true", "yes", "no")` → "yes" |

### Utility Functions

| Function           | Description            | Example                               |
| ------------------ | ---------------------- | ------------------------------------- |
| `escapeHTML(text)` | Escape HTML characters | `escapeHTML("<div>")` → "&lt;div&gt;" |

### File Fields

| Field         | Description                  | Type   |
| ------------- | ---------------------------- | ------ |
| `file.name`   | File name without extension  | String |
| `file.path`   | Full path relative to vault  | String |
| `file.folder` | Parent folder path           | String |
| `file.ext`    | File extension (without dot) | String |
| `file.ctime`  | Creation time                | Date   |
| `file.mtime`  | Modification time            | Date   |

## Property Keys (prop.\*)

Keys starting with `prop.` automatically update the corresponding frontmatter property when expanded. Unlike regular keys, property keys **only update frontmatter** — they don't insert any visible text between the markers.

**Example replacement**:

- Key: `prop.updated`
- Value: `now().format("YYYY-MM-DD")`

**In your note**:

```markdown
---
title: My Note
---

<!-- expand: prop.updated -->
```

When expanded, this will update (or create) the `updated` property in frontmatter:

```markdown
---
title: My Note
updated: 2024-01-15
---

<!-- expand: prop.updated -->
```

The marker stays as-is (no closing marker needed) — it only triggers the frontmatter update. The mode badge and refresh button are still displayed next to the marker.

This is useful for automatically maintaining metadata like:

- `prop.updated` - Last modification date
- `prop.created` - Creation date (use with `once` mode)
- `prop.word-count` - Word count or other computed values

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

### date()

Removes the time component, returning start of day (midnight).

```
now().date().format("HH:mm:ss")
```

Result: `00:00:00`

### time()

Extracts the time portion as a string in HH:mm:ss format.

```
now().time()
```

Result: `14:30:45`

### relative()

Returns a human-readable relative time description.

```
file.mtime.relative()
```

Result: `3 days ago` or `in 2 hours`

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

### title(text)

Converts string to title case (capitalize first letter of each word).

```
title("hello world")
```

Result: `Hello World`

### slice(start, end?)

Extracts a substring. Supports negative indices.

```
upper("hello world").slice(0, 5)
upper("hello world").slice(-5)
```

Results: `HELLO`, `WORLD`

### repeat(n)

Repeats the string N times.

```
upper("ab").repeat(3)
```

Result: `ABABAB`

### reverse()

Reverses the characters in the string.

```
upper("hello").reverse()
```

Result: `OLLEH`

### split(separator, limit?)

Splits a string into an array (displayed as comma-separated).

```
upper("a,b,c").split(",")
```

Result: `A, B, C`

### Boolean String Methods

These methods return `true` or `false`:

**startsWith(query)** - Check if string starts with query:

```
file.name.startsWith("2024")
```

**endsWith(query)** - Check if string ends with query:

```
file.name.endsWith("draft")
```

**contains(value)** - Check if string contains substring:

```
file.name.contains("daily")
```

**containsAll(...values)** - Check if all substrings are present:

```
file.name.containsAll("2024", "meeting")
```

**containsAny(...values)** - Check if any substring is present:

```
file.name.containsAny("draft", "wip", "todo")
```

**isEmpty()** - Check if string is empty:

```
file.name.isEmpty()
```

### Chaining with dates

String functions can be chained after date functions:

```
now().format("MMMM").upper()
```

Result: `JANUARY`

## Number Functions

### number(value)

Parses a string to a number.

```
number("42")
number("-3.14")
```

### abs()

Returns the absolute value.

```
number("-5").abs()
```

Result: `5`

### ceil()

Rounds up to the nearest integer.

```
number("3.2").ceil()
```

Result: `4`

### floor()

Rounds down to the nearest integer.

```
number("3.9").floor()
```

Result: `3`

### round(digits?)

Rounds to the nearest integer, or to specified decimal places.

```
number("3.6").round()
number("3.14159").round(2)
```

Results: `4`, `3.14`

### toFixed(precision)

Formats with a fixed number of decimal places.

```
number("3").toFixed(2)
```

Result: `3.00`

### min(val1, val2, ...)

Returns the minimum value from the arguments.

```
min(5, 3, 8)
```

Result: `3`

### max(val1, val2, ...)

Returns the maximum value from the arguments.

```
max(5, 3, 8)
```

Result: `8`

## Conditional Function

### if(condition, trueResult, falseResult?)

Returns `trueResult` if condition is truthy, otherwise `falseResult`.

**Truthy values**: non-empty strings (except "false", "0", "null", "undefined")
**Falsy values**: empty string, "false", "0", "null", "undefined", whitespace-only

```
if("true", "yes", "no")
if("", "yes", "no")
if("false", "yes", "no")
```

Results: `yes`, `no`, `no`

**Practical example** - Show different text based on file name:

```
if(file.name.contains("draft"), "DRAFT", "Published")
```

## Utility Functions

### escapeHTML(text)

Escapes HTML special characters (`<`, `>`, `&`, `"`, `'`).

```
escapeHTML("<div>Hello</div>")
```

Result: `&lt;div&gt;Hello&lt;/div&gt;`

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
