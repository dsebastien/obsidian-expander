# Usage

## Comment Syntax

Expander uses HTML comments as markers to identify where to insert values. The basic syntax is:

```markdown
<!-- expand: key -->value<!-- /expand: key -->
```

- **Opening marker**: `<!-- expand: key -->` or variant
- **Value**: The content between markers (can be multi-line)
- **Closing marker**: `<!-- /expand: key -->`

The key in the closing marker must match the opening marker.

## Update Modes

Expander supports four update modes, each with a different marker prefix:

### Auto Mode (default)

```markdown
<!-- expand: my-key -->current value<!-- /expand: my-key -->
```

- Updates automatically when the file is modified
- Best for values that should always stay current

### Manual Mode

```markdown
<!-- expand-manual: my-key -->current value<!-- /expand-manual: my-key -->
```

- Only updates via command or the refresh button
- Best for values you want to control explicitly

### Once Mode

```markdown
<!-- expand-once: my-key --><!-- /expand-once: my-key -->
```

- Updates once when empty, then never again
- Best for values that should be set once (like creation dates)

### Once-and-Eject Mode

```markdown
<!-- expand-once-and-eject: my-key --><!-- /expand-once-and-eject: my-key -->
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

<!-- /expand: signature -->
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
