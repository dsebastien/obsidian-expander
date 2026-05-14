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

## Installation

### Community plugins (recommended)

1. In Obsidian, go to **Settings → Community plugins**.
2. Disable **Restricted mode** if it's enabled.
3. Select **Browse**, search for **Expander**, install it, then enable it.

You can also browse the catalog on the [Obsidian Community](https://community.obsidian.md/) website.

### Manual installation

If the plugin isn't listed in the community catalog yet (or you want a specific version):

1. Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/dsebastien/obsidian-expander/releases).
2. Copy them into `<Vault>/.obsidian/plugins/expander/`.
3. Reload Obsidian and enable **Expander** in **Settings → Community plugins**.

### BRAT (bleeding edge)

[BRAT](https://github.com/TfTHacker/obsidian42-brat) (Beta Reviewers Auto-update Tool) installs plugins straight from a GitHub repo and keeps them updated automatically. Use this if you want the latest commits — **things might break**.

1. Install **Obsidian42 - BRAT** from **Settings → Community plugins → Browse** and enable it.
2. Run **BRAT: Add a beta plugin for testing** from the command palette.
3. Paste `https://github.com/dsebastien/obsidian-expander`.
4. Select the latest version and confirm.
5. Enable **Expander** in **Settings → Community plugins**.

## Quick Start

1. Install the plugin (see [Installation](#installation) above).
2. Open **Settings → Expander**
3. Add a replacement (e.g., key: `today`, value: `now().format("YYYY-MM-DD")`)
4. In your note, add:
    ```markdown
    <!-- expand: today -->
    ```
5. The value and closing tag will be automatically inserted

## Syntax

Just add an opening tag - the closing tag is added automatically:

```markdown
<!-- expand: key -->
```

After expansion:

```markdown
<!-- expand: key -->value<!---->
```

Update mode variants:

- `<!-- expand: key -->` - Auto mode (updates on file change)
- `<!-- expand-manual: key -->` - Manual mode (update via command only)
- `<!-- expand-once: key -->` - Once mode (fills once, never updates)
- `<!-- expand-once-and-eject: key -->` - Once-and-eject mode (fills once, removes markers)

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
