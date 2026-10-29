---

name: commit
description: Review, test and commit the pending changes. Runs a code review and the unit tests BEFORE staging anything, then stages and commits only if both pass. Use when the user asks to commit, "commit my changes" or invokes /commit.
disable-model-invocation: true
allowed-tools: Bash(git status:_), Bash(git diff:_), Bash(git log:_), Bash(git add:_), Bash(git commit:_), Bash(yarn test:_)---

# Commit

Commit the pending changes safely. Nothing is staged until the code review and
the unit tests have passed.

## 1. Inspect

Run `git status` and `git diff HEAD` (and `git log -5 --format=%s` to match the
commit message style). If there is nothing to commit, say so and stop.

## 2. Code review (before staging)

Invoke the `code-review` skill on the working-tree diff.

- If it reports bugs or architecture violations, show them to the user and
  **stop**. Do not stage or commit. Offer to fix them (`code-review --fix`) and
  re-run this skill afterwards.
- Style-only nits do not block; mention them in the final summary.

## 3. Unit tests (before staging)

Run `yarn test`.

- If it fails, report the output and **stop**. Fix the cause; never bypass
  with `--no-verify`.

## 4. Stage and commit

Only after steps 2 and 3 pass:

1. Stage files by explicit path (`git add <paths>`), never `git add -A`/`.`.
   Skip secrets (`.env`, credentials) and unrelated changes; ask if unsure.
2. Generate the commit message from the actual changes (the diff from step 1,
   not the conversation), as Conventional Commits matching history
   (`feat: ...`, `fix: ...`, `refactor: ...`, `test: ...`, `chore: ...`):
   - Subject: imperative, under ~72 chars, saying what changed and in which
     area (e.g. the bounded context), focused on the why.
   - Body (only when the change is non-trivial): a short list of the main
     changes and the reason for them.
   - Split into several commits if the diff mixes unrelated concerns.
     Show the message to the user before committing.
3. Commit with a HEREDOC, ending the message with the attribution line from the
   session's system reminder, if one is given.
4. Run `git status` to confirm and report the commit hash and subject.

Do not push unless the user asks.
