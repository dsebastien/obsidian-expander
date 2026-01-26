# Functions

Expander supports function expressions for dynamic values. Functions can be chained together.

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

These functions can be chained after date functions (after `format()`) or used to transform static values.

### lower()

Converts string to lowercase.

```
now().format("MMMM").lower()
```

### upper()

Converts string to uppercase.

```
now().format("MMMM").upper()
```

### trim()

Removes leading and trailing whitespace.

```
trim()
```

### replace(pattern, replacement)

Replaces all occurrences of a pattern with a replacement string.

```
replace("-", "/")
```

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
