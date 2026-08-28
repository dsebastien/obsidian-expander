# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0](https://github.com/dsebastien/obsidian-expander/compare/0.5.0...1.0.0) (2026-08-28)

### ⚠ BREAKING CHANGES

* **plugin:** minAppVersion is now 1.13.0 (was 1.8.7). The settings pane
uses the declarative settings API introduced in Obsidian 1.13.

- getSettingDefinitions() replaces display(): 2 toggles as declared controls,
  the 2 folder lists as native type 'list' groups (framework delete resolving
  entries BY VALUE from the live array; the add control keeps its inline
  FolderSuggest search box), the vault-wide replace action and the support
  block as render: rows, everything indexed by the settings search.
- The replacements editor deliberately keeps its draft-plus-Save semantics
  inside a render: row: replacement keys are live the moment they are stored,
  so persisting every keystroke would let a half-typed key match and expand
  text in notes. The Save button now reports success only after the write
  lands, and a failed persist keeps the draft dirty so Save can retry.
- updateSettings becomes the serialized persist-then-commit write path from
  the template: memory is swapped only after saveData() succeeds, and queued
  writes each derive from the previously committed state so overlapping edits
  cannot drop each other. saveSettings is documented as load-time-only.
- Support block and replacements editor rows get block layout via an
  unlayered .setting-item.exp-settings-embed rule (Obsidian's own flex-row
  rule is unlayered, and unlayered CSS beats layered CSS regardless of
  specificity).
- Tests: settings-guard.spec.ts (source-level guard for the two known-fatal
  render patterns) and settings-write.spec.ts (13 behavioral tests: queue,
  rollback, validation, folder-list races; mutation-checked against an
  optimistic commit and an unserialized chain — 3 tests fail under each).
- Docs: README and docs/configuration.md state the 1.13 requirement;
  AGENTS.md gains the declarative-settings section including the
  draft-plus-Save exception.

### Features

* **plugin:** declare the settings tab (Obsidian 1.13 declarative settings) ([adaeb41](https://github.com/dsebastien/obsidian-expander/commit/adaeb4173a9bad0be4fec364fdcef40f95f9614b))
* **plugin:** show what's new in a tab instead of a modal dialog ([e0c5a18](https://github.com/dsebastien/obsidian-expander/commit/e0c5a180bf3c62515f33607582d9d3683a3a278c))
* **plugin:** surface support CTAs everywhere users can see them ([2ee15ac](https://github.com/dsebastien/obsidian-expander/commit/2ee15acb13f377167879a06f7145a54d1b89ad4d))

### Bug Fixes

* **build:** align with the catalog reviewer's archive, ruleset and audit ([f7fef46](https://github.com/dsebastien/obsidian-expander/commit/f7fef461758d071348d3822ddb0ce33be669f4a6))
* **plugin:** harden the settings write paths after adversarial review ([1578ef8](https://github.com/dsebastien/obsidian-expander/commit/1578ef8aab9c689230c33e9bd21cb221fc6cb6c2))

## [0.5.0](https://github.com/dsebastien/obsidian-expander/compare/0.4.0...0.5.0) (2026-07-29)

### Features

* **plugin:** aggregate what's new dialogs across simultaneously updated plugins ([9ba0fbb](https://github.com/dsebastien/obsidian-expander/commit/9ba0fbb96b5b84cff83e7366177594e3c5e4b616))

## [0.4.0](https://github.com/dsebastien/obsidian-expander/compare/0.3.0...0.4.0) (2026-07-29)

### Features

* **plugin:** add Knowii community to the what's new dialog and harden it ([659a07f](https://github.com/dsebastien/obsidian-expander/commit/659a07fa729f52a39e1c159ad288c20acdd70c2b))
* **plugin:** add Knowii community to the what's new dialog and harden it ([7b47f11](https://github.com/dsebastien/obsidian-expander/commit/7b47f1120e5c92e08d75de35d4edbf2b14aa80a5))

## [0.3.0](https://github.com/dsebastien/obsidian-expander/compare/0.2.3...0.3.0) (2026-07-27)

### Features

* **plugin:** show a what's new dialog once after plugin updates ([3347dd4](https://github.com/dsebastien/obsidian-expander/commit/3347dd4ab8820f010df0d0c0bf87976c58ad844c))

## [0.2.3](https://github.com/dsebastien/obsidian-expander/compare/0.2.2...0.2.3) (2026-07-17)

## [0.2.2](https://github.com/dsebastien/obsidian-expander/compare/0.2.1...0.2.2) (2026-05-14)

## [0.2.1](https://github.com/dsebastien/obsidian-expander/compare/0.2.0...0.2.1) (2026-05-13)

## [0.2.0](https://github.com/dsebastien/obsidian-expander/compare/0.1.0...0.2.0) (2026-05-13)

### Features

* **all:** improved release notes gen ([ffdc01f](https://github.com/dsebastien/obsidian-expander/commit/ffdc01faea8b67b3b6cf08e8dacc96d5a62ea698))
* **all:** updated scripts ([e6d9c48](https://github.com/dsebastien/obsidian-expander/commit/e6d9c48047a7e59b070a23a8d542db1dafd107a6))

## [0.1.0](https://github.com/dsebastien/obsidian-expander/compare/0.0.2...0.1.0) (2026-01-30)

### Features

* **all:** updated ([c60ff04](https://github.com/dsebastien/obsidian-expander/commit/c60ff0466aab7be7616f82e398f713da0e767c03))
* **all:** updated release ([5ab90ca](https://github.com/dsebastien/obsidian-expander/commit/5ab90ca443b8b13953afc90ac93c406595312069))

## [0.0.2](https://github.com/dsebastien/obsidian-expander/compare/0.0.1...0.0.2) (2026-01-30)

### Features

* **all:** added release and validate scripts ([b03baef](https://github.com/dsebastien/obsidian-expander/commit/b03baef8544f57a2733d750f6a6107413122270b))

## 0.0.1 (2026-01-29)

### Features

* **all:** add folder suggest to the settings screen ([c0f8d93](https://github.com/dsebastien/obsidian-expander/commit/c0f8d9306349b378d28805d606ddaf93df46b350))
* **all:** added support for file.* in values ([3962216](https://github.com/dsebastien/obsidian-expander/commit/39622164b92f4a217e4c1e6d363424f9118d0a57))
* **all:** added support for updating note properties ([531c973](https://github.com/dsebastien/obsidian-expander/commit/531c973b841d837e7b964b4a57b36a97f6410c9e))
* **all:** added validation script ([803f303](https://github.com/dsebastien/obsidian-expander/commit/803f303cd99684b7f38801911f33e5a3e6a0feb8))
* **all:** better handle completing incomplete expansions ([5e4b813](https://github.com/dsebastien/obsidian-expander/commit/5e4b8139022ba937ea688dedcdcfbaa29f18562e))
* **all:** first iteration ([c5c4068](https://github.com/dsebastien/obsidian-expander/commit/c5c406889c9721c673016b8f45140a10820cd576))
* **all:** improve settings screen ([3583189](https://github.com/dsebastien/obsidian-expander/commit/3583189e4d64f49d4a497ff42f740852ecde5ba0))
* **all:** improved property replacements ([d9065cf](https://github.com/dsebastien/obsidian-expander/commit/d9065cf786f5876f5a6b1f2f6302f0f5cfc17e3d))
* **all:** improved settings handling (prevent saving invalid duplicate keys) ([9b3c9c8](https://github.com/dsebastien/obsidian-expander/commit/9b3c9c8624a4eef00f680997e1eaf7c3e0e62b29))
* **all:** improves functions ([2fb96d6](https://github.com/dsebastien/obsidian-expander/commit/2fb96d6678be750d73cf8259c8b013495f72421a))
* **all:** shortened the syntax ([fab6429](https://github.com/dsebastien/obsidian-expander/commit/fab6429a581eb956597d00f935f2be99fce313c0))











