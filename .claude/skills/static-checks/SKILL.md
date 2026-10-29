---
name: static-checks
description: Run the formatting and lint checks (yarn format:check and yarn lint) and report the results. Use as part of a code review, before committing, or when the user asks to check formatting or lint.
allowed-tools: Bash(yarn format:check), Bash(yarn lint)
---

# Static checks

Run both checks, even if the first one fails, so the report is complete.

1. `yarn format:check` (Prettier)
2. `yarn lint` (oxlint + architecture rules via `lint:arch`)

## Report

- If both pass, say so in one line.
- If either fails, show the relevant output (file, rule, line) and group the
  findings by check. Treat architecture violations from `lint:arch` as blocking;
  formatting issues are fixable with `yarn format`.
- Do not fix anything or bypass hooks unless the user asks. Offer
  `yarn format` for formatting failures.
