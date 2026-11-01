---
name: commit-message
description: Generates concise single-line commit messages by reading project-specific rules from assets/message-rules.md. Adaptable across projects for custom tenses, ticket prefixes, conventional commits, or plain descriptions. Use when the user asks for a commit message or commit description. Do not use for PR descriptions, changelogs, or release notes.
---

# Commit Message Generator

Generates concise, single-line commit messages adhering to project-specific rules defined in external rule files.

## Procedure

1. **Locate and Read the Rules File:**
   - Check for active project or skill message rules in this priority order:
     1. Project-level: `<workspace>/.agents/skills/commit-message/assets/message-rules.md`
     2. Skill-level: `assets/message-rules.md` (relative to this skill directory)
     3. Sample fallback: `assets/message-rules.md.sample`
   - Read the file using `view_file` to determine:
     - **Format & Structure**: Pattern, whether ticket IDs or conventional commit prefixes (`feat:`, `fix:`) are enabled or forbidden.
     - **Verb Tense & Casing**: Preferred verb forms (e.g., gerund `-ing` vs. imperative base form, capitalization rules).
     - **Constraints**: Word limit (typically max 15 words), punctuation (no trailing periods), and emoji restrictions.
     - **Examples**: Follow the style demonstrated in the rules file's verified examples.

2. **Inspect the Code Changes:**
   - Check staged changes (`git diff --cached`) or recent uncommitted changes (`git diff` / `git status`) to determine the single primary intent of the commit.
   - Focus on **what** was done and **why**, rather than implementation minutiae or file paths (unless the file is the subject).

3. **Format the Commit Message:**
   - Adhere strictly to the loaded rules from `message-rules.md`.
   - Never add story/ticket IDs or conventional commit prefixes if the active rules forbid them.
   - Output the single line message clearly for the user.

## Generic Fallback Rules (When No Rules File Exists)

If neither `assets/message-rules.md` nor `assets/message-rules.md.sample` can be found, use these defaults:
- One line only, max 15 words.
- Imperative mood, capitalize first word.
- No trailing period, no emojis.
