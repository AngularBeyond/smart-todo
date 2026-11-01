# Verification Gates Matrix

Use this matrix to execute the appropriate verification checks based on modified file paths before creating a commit.

## 1. Scope Detection & Commands

### Frontend Scope (`smart-todo/`)
Triggered when changes modify files under `smart-todo/`:

1. **TypeScript Typecheck**:
   ```bash
   npx tsc -p tsconfig.app.json --noEmit && npx tsc -p tsconfig.spec.json --noEmit
   ```
   - Must exit with return code `0`.
   - Must produce zero type errors.

2. **Unit Test Suite**:
   ```bash
   npx ng test --watch=false
   ```
   - All test files must pass.
   - Zero test regressions allowed.

3. **Production Build (Smoke Test)**:
   ```bash
   npm run build
   ```
   - Verifies bundle generation and production tree-shaking succeed.

---

### Backend Scope (`smart-todo-api/`)
Triggered when changes modify files under `smart-todo-api/`:

1. **Unit Test Suite**:
   ```bash
   npm test
   ```
   - All service, controller, and filter unit tests must pass.

2. **E2E Integration Test Suite**:
   ```bash
   npm run test:e2e
   ```
   - Execute when routing, auth, guards, interceptors, or database schemas change.

3. **NestJS Build**:
   ```bash
   npm run build
   ```
   - Must compile with zero errors.

---

### Documentation / Skill Scope
Triggered when changes only modify markdown files in `docs/` or `.agents/skills/`:
- Verification check: Validate markdown file syntax and relative links.
- No compilation command required.

---

## 2. Failure Recovery Procedures

| Failure Type | Required Action |
| :--- | :--- |
| **Type Check Error** | Inspect the file and line number in the compiler output. Fix type annotations, imported symbols, or interface discrepancies. Never use `any` to bypass checks. |
| **Unit Test Failure** | Inspect test failure assertion diff. Update code logic if broken, or update test expectations if specifications intentionally changed. Re-run tests until passing. |
| **Build Error** | Check for missing imports, syntax errors, or bundle budget violations. Resolve before committing. |
