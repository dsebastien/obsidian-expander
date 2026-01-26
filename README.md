# Obsidian Expander

Replace variables across your Obsidian vault using HTML comment markers. Configure key-value pairs in settings, and Expander will automatically substitute them throughout your notes, and keep those updated too.

## Features

- **Variable Replacement**: Define key-value pairs that get expanded throughout your vault
- **Dynamic Values**: Use function expressions like `now().format("YYYY-MM-DD")` for dynamic content
- **Update Modes**: Control when expansions update
    - **Auto**: Updates automatically on file changes
    - **Manual**: Updates only via command or button
    - **Once**: Updates once, then never again
    - **Once-and-Eject**: Updates once, removes markers
- **Folder Filtering**: Choose which folders to scan or ignore
- **Visual Feedback**: Mode badges and refresh buttons in the editor
- **Commands**: Replace values in current note or entire vault, add new expansion, ...

## Quick Start

1. Install the plugin from Obsidian Community Plugins (NOT supported yet; install manually or use BRAT)
2. Open **Settings → Expander**
3. Add a replacement (e.g., key: `today`, value: `now().format("YYYY-MM-DD")`)
4. In your note, add:
    ```markdown
    <!-- expander: today --><!-- /expander: today -->
    ```
5. The value will be automatically inserted between the markers

## Syntax

```markdown
<!-- expander: key -->value<!-- /expander: key -->
```

Update mode variants:

- `<!-- expander: key -->` - Auto mode
- `<!-- expander-manual: key -->` - Manual mode
- `<!-- expander-once: key -->` - Once mode
- `<!-- expander-once-and-eject: key -->` - Once-and-eject mode

## Functions

Dynamic values using function expressions:

| Function            | Description       | Example                        |
| ------------------- | ----------------- | ------------------------------ |
| `now()`             | Current date/time | `now().format("YYYY-MM-DD")`   |
| `today()`           | Today at midnight | `today().format("MM/DD/YYYY")` |
| `format(pattern)`   | Format date       | `now().format("HH:mm")`        |
| `lower()`           | Lowercase         | `now().format("MMMM").lower()` |
| `upper()`           | Uppercase         | `now().format("MMMM").upper()` |
| `trim()`            | Trim whitespace   |                                |
| `replace(old, new)` | Replace text      | `replace("-", "/")`            |

## Documentation

Full documentation available at [docs/](docs/README.md).

## Development

See [DEVELOPMENT.md](./DEVELOPMENT.md) for build instructions, testing setup, and contribution guidelines.

## Support

If you find this plugin useful, consider supporting my work:

- [GitHub Sponsors](https://github.com/sponsors/dsebastien)
- [Buy me a coffee](https://www.buymeacoffee.com/dsebastien)
- [Check out my products](https://store.dsebastien.net)

## License

MIT License - see [LICENSE](./LICENSE) for details.

## News & Updates

To stay up to date about this plugin, Obsidian in general, Personal Knowledge Management and note-taking:

- Subscribe to [my newsletter](https://dsebastien.net/newsletter)
- Follow me on [X/Twitter](https://x.com/dSebastien)

## Author

Created by [Sébastien Dubois](https://dsebastien.net) ([@dSebastien](https://x.com/dSebastien))
