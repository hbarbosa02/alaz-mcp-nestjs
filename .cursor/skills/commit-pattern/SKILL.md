---
name: commit-pattern
description: Aligns git commits and messages with this repo’s Conventional Commits rule and pre-commit gate (lint, format, tests). Use when writing or reviewing commit messages, before git commit or push, when running pre-commit checks, or when the user mentions conventional commits, npm run precommit, or .githooks.
---

# Commit pattern (project)

Canonical detail and examples: [.cursor/rules/commit-pattern.mdc](../../rules/commit-pattern.mdc).

## Workflow (every commit)

1. **Run the gate** (or ensure the local hook will pass): `npm run precommit`  
   - Hook: `core.hooksPath` → `.githooks` runs the same on `git commit` when configured (`npm install` runs `prepare`).

2. **Draft the message** using Conventional Commits:

   ```text
   <type>(<optional-scope>): <imperative subject>
   ```

   - Types: `feat` | `fix` | `docs` | `style` | `refactor` | `test` | `chore` | `ci` | `perf` | `build`
   - Subject: imperative, no trailing period, ≤ 72 characters
   - Optional body after a blank line; optional footer: `BREAKING CHANGE:`, `Refs #id`, `Closes #id`

3. **Before push** — confirm: single logical change, no secrets or junk files, and update `README.md` / `docs/` when user-visible behavior changed. For risky changes, also run `npm run test:e2e`.

4. If `precommit` fails: use `npm run lint:fix`, `npm run format`, fix tests, then recommit. Use `git commit --no-verify` only in exceptional cases (hook skipped intentionally).

## Anti-patterns (reject)

- Subjects like `WIP`, `update`, `fix stuff`, or ticket-only lines
- Subject ending with `.`
- Vague or mixed unrelated changes in one commit

## Commands

| Goal | Command |
| ---- | ------- |
| Full local gate | `npm run precommit` |
| Lint fix | `npm run lint:fix` |
| Format | `npm run format` |
| Unit tests | `npm test` |
| E2E (when needed) | `npm run test:e2e` |
