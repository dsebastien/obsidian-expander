# Expander

Replace variables across your vault using HTML comment markers. Configure key-value pairs in settings, and Expander will automatically substitute them throughout your notes.

## Key Features

- **Variable Replacement**: Define key-value pairs that get expanded throughout your vault
- **Dynamic Values**: Use function expressions like `now().format("YYYY-MM-DD")` for dynamic content
- **Update Modes**: Control when expansions are updated (auto, manual, once, once-and-eject)
- **Folder Filtering**: Choose which folders to scan or ignore
- **Visual Feedback**: See mode badges and refresh buttons directly in the editor
- **Commands**: Replace values in current note or entire vault with a single command

## Quick Start

1. Install the plugin
2. Open Settings → Expander
3. Add a replacement (e.g., key: `today`, value: `now().format("YYYY-MM-DD")`)
4. In your note, add: `<!-- expand: today --><!---->`
5. The value will be automatically inserted between the markers

## About

Created by [Sébastien Dubois](https://dsebastien.net).

If you find this plugin useful, consider supporting my work:

- [GitHub Sponsors](https://github.com/sponsors/dsebastien)
- [Buy me a coffee](https://www.buymeacoffee.com/dsebastien)
- [Check out my products](https://store.dsebastien.net)

Stay up to date by subscribing to [my newsletter](https://dsebastien.net/newsletter).
