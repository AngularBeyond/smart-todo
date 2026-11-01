# Commit Message Skill (`/commit-message`)

A customizable agent skill that inspects git diffs and generates concise, single-line commit messages adhering to project-specific conventions.

---

## How to Use

### 1. In AI Chat / Slash Command
Trigger the skill in your agent session:
- Type `/commit-message` in the chat, or
- Ask: `"Generate a commit message for my staged changes."`

The agent will:
1. Inspect your staged (`git diff --cached`) or working tree changes.
2. Load the project's rules from `assets/message-rules.md`.
3. Output a single-line commit message formatted according to the active rules.

---

## File Structure

```
commit-message/
├── SKILL.md                  # Agent execution instructions and procedure
├── README.md                 # Developer guide (this file)
└── assets/
    ├── message-rules.md        # Active rules applied to commit messages in this project
    └── message-rules.md.sample # Catalog of rule presets (JIRA, Conventional, Plain, etc.)
```

---

## Configuring Rules for Your Project

The rules governing the generated messages are located in:
`assets/message-rules.md`

### Current Configuration (This Project)
This repository uses **Plain Descriptive / Action-Oriented** style:
- **No ticket prefixes** (no JIRA numbers, no `STORY-X.Y:`)
- **No conventional commit type prefixes** (no `feat:`, `fix:`, `refactor:`)
- **Grammar**: Gerund (`-ing`) or imperative verbs (e.g., `Refactoring the register page...`, `Connect login form...`)
- **Capitalization**: First word capitalized
- **Constraints**: 1 line, maximum 15 words, no trailing periods, no emojis

---

## Adopting Other Styles (JIRA, Conventional Commits, etc.)

To change the format for another project or workflow:

1. Open `assets/message-rules.md.sample`.
2. Choose one of the included presets or customize your own:
   - **Preset A: Plain Descriptive** (Current default)
     ```
     Refactoring the register page to angular signal forms
     ```
   - **Preset B: JIRA Ticket + Conventional Commits**
     ```
     PROJ-1234: feat(auth): add signal forms to registration page
     ```
   - **Preset C: JIRA Ticket + Plain Imperative**
     ```
     [PROJ-1234] Refactor registration page to use signal forms
     ```
   - **Preset D: Standard Conventional Commits**
     ```
     feat(auth): migrate register page to angular signal forms
     ```
3. Copy your chosen preset into `assets/message-rules.md`.

---

## Copying This Skill to Another Repository

To reuse this skill in another repository:
1. Copy the `.agents/skills/commit-message/` directory into your new project's `.agents/skills/` folder.
2. Edit `assets/message-rules.md` to reflect that project's naming conventions and ticket policies.
