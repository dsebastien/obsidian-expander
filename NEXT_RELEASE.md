### Fixed

- **Unsaved replacement edits are no longer lost.** Adding or removing a scanned folder, or adding, deleting or moving a replacement, used to redraw the settings and silently drop the edits you had not saved yet. They now stay on screen, still unsaved, with Save available.
- **A deleted replacement can no longer come back.** Clicking Save while a delete was still being written could write the deleted key back, where it kept expanding in your notes. Saves and list changes now happen one at a time.
- **Invalid keys are never stored.** Adding, deleting or moving a replacement saves the whole list, and could store a key that Save would have refused (not kebab-case, or a duplicate). These actions now stop and tell you which key to fix first.
