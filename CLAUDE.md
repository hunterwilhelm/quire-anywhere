# Quire Anywhere

Chrome extension that adds tasks to Quire.io from the current page, a link, or a Google Docs selection.

## Layout
- `app/` is the extension root (load unpacked from here). Manifest V2: background page, `browser_action`, content script on Google Docs.
  Don't migrate to MV3 unless asked.
- `app/views/` (popup, settings, background) is UI; `app/modules/` holds services (`api.*`, `login.*`, `chrome.service.js`,
  `translation.*`, `update.service.js`), storage (`storage.service.js`), and site-specific extraction (`content.utils.js`,
  `google.docs.utils.js`); `app/models/` holds data models; `app/scripts/content.js` is the content-script entry point.
- `app/libraries/` is vendored third-party code (jQuery, Bootstrap, Font Awesome). Never edit it.
- `quire-anywhere/` is the PHP OAuth relay hosted on zicy.net. `app.secret.php` holds the client secret and is gitignored; never read,
  print, or commit it.
- No build step, package manager, or test suite. Verify by reloading the unpacked extension in `chrome://extensions`.

## Core rules
- Ask before building only when a wrong guess would be expensive to undo; otherwise proceed and state the assumption.
- Be concise and stay on task: short, plain answers, no headers/bullets for a single fact, no restating file contents, at most one
  sentence of "here's what I'm about to do", and no end-of-turn recap unless the change is multi-file or non-obvious.
- For multi-file or behavior-changing work, present a short plan before editing.
- When work surfaces adjacent bugs, cleanup opportunities, or ideas beyond the task: fix true blockers (needed for the task to work
  correctly/safely) and small opportunistic fixes (same code path, low-risk, independently understandable, ≤~15 min); everything else is
  a follow-up, noted in `tmp/TODO.md` (untracked) rather than folded into the current change. At the end of the task, report what was requested, what
  was additionally fixed, and what was deferred.
- Prefer existing platform and library capabilities (Chrome APIs, Quire's API, the vendored libraries) over custom code; never duplicate
  what they provide. Don't add new dependencies without asking.
- Preserve the architecture split:
  - UI (`views/`): popup, settings page, context-menu entry points; presentation state only.
  - Services (`modules/`): Quire API client, login/OAuth, metadata extraction, task-creation logic.
  - Storage: everything that touches `chrome.storage`/`localStorage` goes through `StorageService`.
  - Content scripts do extraction only; no API calls or tokens.
- Keep remembered preferences (`storage.sync`), device-local settings and tokens (`storage.local`), and transient popup state separate.
- Least privilege: request the minimum permissions and host permissions; prefer `activeTab` over broad host access. No remote code.
- Keep Quire tokens and the client secret out of logs, content scripts, and the repo; handle auth failure, token refresh, and rate limits
  explicitly.
- Favor low-friction capture: one-click or keyboard-first add, sensible defaults (last-used project), no required fields.
- Prefer small adapter-style modules for extracting from specific site types (like `google.docs.utils.js`) over hardwired branching.
- Versions in `app/manifest.json`: right after a release, bump `version` to the next one and set `version_name` to "Beta x.y.z-dev";
  when releasing, drop the `-dev`.
- Line wrapping: commit messages get no line breaks (one long line per paragraph). Everything else wraps at 140 columns; comments,
  docstrings, and prose are wrapped by hand. Only wrap new or edited paragraphs.
- American spelling (-ize, not -ise). Docs and commit messages: as short as possible.

## Model guidance
- The main session is Sonnet at medium effort. Use it directly for normal implementation, refactors, docs, and routine debugging.
- Switching models via `/model` resends the whole history and invalidates the prompt cache. Reserve it for a durable shift in what the
  rest of the session needs; state the recommendation in one line and wait.
- Subagents start cold. Delegate only to keep bulk reading out of the main context or when the sub-task needs more reasoning than the
  main thread has. Always pass an explicit `model`: `haiku` for search/mechanical work, `sonnet` for implementation-sized sub-tasks,
  `opus` for gnarly design or debugging (have it return a plan; execute elsewhere). Never `fable` unless asked.
- Brief a subagent like a colleague with no memory of this conversation.

## Workflow
- Main branch is `develop`. Feature work goes on `feature/<name>` branches; keep PRs small.
- Commit locally, but don't push or open a PR until the user has tested the change and says to.
- Before committing: state what to check manually in the reloaded extension, then update docs (README, CLAUDE.md if rules or layout
  changed, comments describing changed behavior) and `tmp/TODO.md`, then commit. Do this before every push or PR, not after.
- Before starting feature work and before opening a PR, check open issues (`gh issue list`) for related or fixable ones; link them in the
  PR body (`Fixes #n`) when the change resolves them, and mention related ones that stay open.
- These steps are enforced by hooks in `.claude/settings.json` (`.claude/hooks/`): `git push` and `gh pr create` are blocked until the
  command ends with `# checklist-done`, and `gh pr create` then reminds you to process review comments. Don't append the marker until the
  checklist is actually done.
- After opening a PR, and whenever asked, read its review comments (`gh pr view <n> --comments`,
  `gh api repos/{owner}/{repo}/pulls/<n>/comments`; Sourcery posts here). Verify each against the code or live behavior: fix valid
  ones on the same branch, reply to the rest with why not, resolve the threads, and report which was which.
- Docs-only changes go straight to `develop`, no PR.
- Update `README.md` for user-visible changes; `tmp/TODO.md` (untracked) for deferred work.
