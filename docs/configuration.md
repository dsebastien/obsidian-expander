# Configuration

## Replacement Definitions

The core of Expander is the list of key-value pairs you define.

### Key Format

Keys must be in **kebab-case**:

- Lowercase letters (`a-z`)
- Numbers (`0-9`)
- Hyphens (`-`)
- No leading or trailing hyphens

**Valid examples**: `my-key`, `hello-world`, `version-123`, `email`

**Invalid examples**: `My-Key`, `hello_world`, `-start`, `end-`

### Value Format

Values can be:

- **Static text**: Any string
- **Function expressions**: Dynamic values using functions (see [Functions](functions.md))

### Enabled Toggle

Each replacement has an enabled toggle. Disabled replacements are ignored during processing.

## Folder Settings

### Folders to Scan

Comma-separated list of folders to include in vault-wide replacements. Leave empty to scan all folders.

Example: `notes, projects/active`

### Folders to Ignore

Comma-separated list of folders to exclude from scanning.

Example: `templates, archive, .obsidian`

## Behavior Settings

### Disable Automatic Updates

When enabled, auto-mode expansions will not update automatically on file change. You'll need to use commands or the refresh button instead.

### Show Refresh Button

Toggle visibility of the refresh button next to expansion markers in the editor.
