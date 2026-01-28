# Tips and Best Practices

## Common Use Cases

### Version Numbers

Keep version numbers synchronized across your vault:

```markdown
Version: <!-- expand: version -->1.2.3<!---->
```

### Dates

Insert today's date:

```markdown
Date: <!-- expand: today --><!---->
```

With value: `now().format("YYYY-MM-DD")`

### Signatures

Standard email signature:

```markdown
<!-- expand: signature -->

Best regards,
Your Name

<!---->
```

### Template Fields

Use once-and-eject for template fields that should be filled once:

```markdown
Created: <!-- expand-once-and-eject: creation-date --><!---->
```

## Best Practices

### Use Descriptive Keys

Choose keys that clearly describe their purpose:

- Good: `project-version`, `author-email`, `current-quarter`
- Avoid: `v`, `e`, `q`

### Organize with Prefixes

Group related keys with prefixes:

- `meta-author`, `meta-version`, `meta-updated`
- `contact-email`, `contact-phone`, `contact-address`

### Use Once Mode for Immutable Values

For values that should be set once and never change:

```markdown
Created: <!-- expand-once: created --><!---->
```

### Use Manual Mode for Controlled Updates

For values you want to update explicitly:

```markdown
Status: <!-- expand-manual: project-status -->In Progress<!---->
```

### Test Function Expressions

The settings UI shows a preview of function expression results. Use this to verify your expressions before using them.

## Troubleshooting

### Unknown Keys Warning

If you see a warning about unknown keys, check:

1. The key exists in your settings
2. The key is enabled
3. The key spelling matches exactly

### Values Not Updating

If auto-mode values aren't updating:

1. Check "Disable automatic updates" is off
2. Verify the file is in a scanned folder
3. Try the "Replace values in current note" command

### Markers Not Recognized

Ensure:

1. Opening and closing markers use the same mode (expand vs expand-manual)
2. Keys match exactly in opening and closing markers
3. No typos in the marker syntax
