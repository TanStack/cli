---
'@tanstack/cli': patch
---

fix(cli): make add-on multiselect keyboard controls discoverable

Users encountering the add-on multiselect prompt during `tanstack create`
often didn't realize the entries are checkboxes (toggle with Space) and
that the selection must be confirmed with Enter. The existing keyboard
shortcuts note was only shown once per session and could appear before
single-select prompts where it didn't apply. Now:

- The "Keyboard Shortcuts" note is shown immediately above every
  multiselect prompt and is no longer shown before single-select prompts.
- The multiselect message itself includes an inline `(Space to toggle,
  Enter to confirm)` hint so the cue is inseparable from the prompt.
