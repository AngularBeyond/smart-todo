---
name: auto-commit
description: Executes an automated, verified git commit workflow after completing a meaningful unit of work, story sub-phase, refactor, or bug fix. Verifies code quality via compilation and unit tests, stages intentional changes, generates a project-compliant commit message via the commit-message skill and assets/message-rules.md, and creates local commits without pushing. Use whenever the user requests an auto-commit or upon completing relevant development work. Do not use for broken, unverified, or in-progress changes that fail tests or compilation.
---

# Auto-Commit Workflow

Execute a verified, automated git commit sequence after completing any relevant unit of work.

## Core Rules & Constraints

> [!CRITICAL]
> **NEVER PUSH COMMITS (`git push` IS STRICTLY FORBIDDEN)**:
> All commits created by this workflow must remain strictly local. Under no circumstances should `git push` or pushing to any remote branch be executed. Only the user may push changes to remote.

## Defining "Relevant Work" & Commit Boundaries

A unit of work that warrants an individual commit must satisfy the **Atomic Verifiable Slice** rule:

1. **Single User Intent**: If a feature or story encompasses multiple user actions or distinct concerns (e.g., Profile Details vs. Change Password; List CRUD vs. List Reordering), EACH intent must be implemented and committed in its own sub-phase.
2. **Cohesive Vertical Slice**: A commit should bundle the cohesive set of files for that single intent:
   - Model / DTO contracts for the slice
   - Feature store state and `rxMethod` pipelines
   - Presentational component and template
   - Dedicated unit tests verifying that slice
3. **Zero Regressions & Clean Gate**: The codebase must compile cleanly (`tsc`) and unit tests must pass before each commit is recorded.
4. **No Batched Multi-Feature Commits**: Never batch multiple independent features, forms, or sub-phases into a single commit.

## Procedure

### Step 1: Run Pre-Commit Verification Gate
1. Inspect the scope of modified files (`git status`).
2. Read `references/verification-matrix.md` to identify the required verification checks for the modified project areas (Frontend, Backend, or Documentation).
3. Execute the corresponding test and compilation commands.
4. Verify that all commands exit with code `0` and zero failures.
5. If any check fails, abort the commit sequence immediately and resolve the error before continuing.

### Step 2: Inspect and Stage Intentional Changes
1. Run `git status` to review modified, deleted, and untracked files.
2. Run `git diff` to confirm that all changes are intentional.
3. Stage only the target files:
   ```bash
   git add <path1> <path2> ...
   ```
4. Exclude secrets (`.env`), temporary files, debug statements, and untracked scratch files from staging.

### Step 3: Generate Commit Message
1. Read `.agents/skills/commit-message/assets/message-rules.md` to retrieve the project's active commit formatting rules and constraints.
2. Run `git diff --cached` to analyze the staged changes and determine the primary intent of the commit.
3. Formulate a single-line commit message strictly following the loaded project rules:
   - Match the configured format pattern (e.g., plain action phrase vs. ticket prefix).
   - Use the configured verb tense (e.g., gerund `-ing` or imperative mood).
   - Enforce word limit (maximum 15 words) and capitalization rules.
   - Forbid trailing periods, semicolons, and emojis.

### Step 4: Create the Commit
1. Execute the git commit command:
   ```bash
   git commit -m "<generated commit message>"
   ```
2. Verify that the commit was successfully recorded:
   ```bash
   git log -n 1 --oneline
   ```
3. **DO NOT PUSH**: Never run `git push`. Stop after creating the local commit.

### Step 5: Report Summary
1. Display the commit hash and single-line message.
2. Report the verification checks that passed prior to committing.

---

## Error Handling

### Pre-Commit Gate Failures
- **Compilation / Type Check Errors**:
  - Do not proceed with staging or committing.
  - Review compiler output, correct syntax and type discrepancies, and re-run typecheck until clean.
- **Unit / E2E Test Failures**:
  - Do not commit broken behavior.
  - Inspect test assertion failures, resolve regressions in code or tests, and re-verify until 100% passing.

### Missing Rules Configuration
- If `.agents/skills/commit-message/assets/message-rules.md` is missing, check `.agents/skills/commit-message/assets/message-rules.md.sample`.
- If no rules file exists, fall back to: single-line, imperative mood, capitalize first word, maximum 15 words, no trailing punctuation.

### Dirty Staging Area
- If unwanted files are staged, unstage them using `git restore --staged <file>` before committing.
