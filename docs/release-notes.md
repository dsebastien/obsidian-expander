# Release Notes

## 1.0.0 (2026-08-28)

### ⚠ BREAKING CHANGES

- **plugin:** minAppVersion is now 1.13.0 (was 1.8.7). The settings pane
  uses the declarative settings API introduced in Obsidian 1.13.

* getSettingDefinitions() replaces display(): 2 toggles as declared controls,
  the 2 folder lists as native type 'list' groups (framework delete resolving
  entries BY VALUE from the live array; the add control keeps its inline
  FolderSuggest search box), the vault-wide replace action and the support
  block as render: rows, everything indexed by the settings search.
* The replacements editor deliberately keeps its draft-plus-Save semantics
  inside a render: row: replacement keys are live the moment they are stored,
  so persisting every keystroke would let a half-typed key match and expand
  text in notes. The Save button now reports success only after the write
  lands, and a failed persist keeps the draft dirty so Save can retry.
* updateSettings becomes the serialized persist-then-commit write path from
  the template: memory is swapped only after saveData() succeeds, and queued
  writes each derive from the previously committed state so overlapping edits
  cannot drop each other. saveSettings is documented as load-time-only.
* Support block and replacements editor rows get block layout via an
  unlayered .setting-item.exp-settings-embed rule (Obsidian's own flex-row
  rule is unlayered, and unlayered CSS beats layered CSS regardless of
  specificity).
* Tests: settings-guard.spec.ts (source-level guard for the two known-fatal
  render patterns) and settings-write.spec.ts (13 behavioral tests: queue,
  rollback, validation, folder-list races; mutation-checked against an
  optimistic commit and an unserialized chain — 3 tests fail under each).
* Docs: README and docs/configuration.md state the 1.13 requirement;
  AGENTS.md gains the declarative-settings section including the
  draft-plus-Save exception.

### Features

- **plugin:** declare the settings tab (Obsidian 1.13 declarative settings)
- **plugin:** show what's new in a tab instead of a modal dialog
- **plugin:** surface support CTAs everywhere users can see them

### Bug Fixes

- **build:** align with the catalog reviewer's archive, ruleset and audit
- **plugin:** harden the settings write paths after adversarial review

## 0.5.0 (2026-07-29)

### Features

- **plugin:** aggregate what's new dialogs across simultaneously updated plugins

## 0.4.0 (2026-07-29)

### Features

- **plugin:** add Knowii community to the what's new dialog and harden it
- **plugin:** add Knowii community to the what's new dialog and harden it

## 0.3.0 (2026-07-27)

### Features

- **plugin:** show a what's new dialog once after plugin updates

## 0.2.3 (2026-07-17)

## 0.2.2 (2026-05-14)

## 0.2.1 (2026-05-13)

## 0.2.0 (2026-05-13)

### Features

- **all:** improved release notes gen
- **all:** updated scripts

## 0.1.0 (2026-01-30)

### Features

- **all:** updated
- **all:** updated release

## 0.0.2 (2026-01-30)

### Features

- **all:** added release and validate scripts

## 0.0.1 (2026-01-29)

### Features

- **all:** add folder suggest to the settings screen
- **all:** added support for file.\* in values
- **all:** added support for updating note properties
- **all:** added validation script
- **all:** better handle completing incomplete expansions
- **all:** first iteration
- **all:** improve settings screen
- **all:** improved property replacements
- **all:** improved settings handling (prevent saving invalid duplicate keys)
- **all:** improves functions
- **all:** shortened the syntax
