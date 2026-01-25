# Remove User Disable/Enable + ESLint Fix Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove user disable/enable end-to-end (keep only DELETED) and fix CI ESLint TypeScript parsing failures.

**Architecture:** Keep `User.status` for deletion only, drop `disabledReason`, and treat any non-DELETED user as active for login/list. Add a migration to normalize statuses and remove the column. Ensure ESLint explicitly enables TS parsing so CI can lint `.ts/.d.ts`.

**Tech Stack:** Vue 3 + Vite, Node/ESM, Prisma (SQLite), Bun tests, ESLint (antfu config).

---

### Task 1: Add failing tests (TDD)

**Files:**

- Modify: `server/tests/user-delete-data.test.ts`
- Modify: `server/tests/user-filter.test.ts`
- Create: `server/tests/user-login-status.test.ts`
- Create: `server/tests/eslint-config.test.ts`

**Step 1: Write failing tests**

```text
// server/tests/user-delete-data.test.ts
expect(buildUserDeleteData()).toEqual({ status: 'DELETED' })
```

```text
// server/tests/user-filter.test.ts
expect(where).toMatchObject({ status: { not: 'DELETED' } })
```

```text
// server/tests/user-login-status.test.ts
import { canLoginWithStatus } from '../src/models/user'
expect(canLoginWithStatus('DELETED')).toBe(false)
expect(canLoginWithStatus('ACTIVE')).toBe(true)
```

```text
// server/tests/eslint-config.test.ts
const configText = readFileSync(eslintPath, 'utf8')
expect(configText).toContain('typescript: true')
```

**Step 2: Run tests to verify failures**

Run: `bun test server/tests/user-delete-data.test.ts`
Expected: FAIL (extra disabledReason)

Run: `bun test server/tests/user-filter.test.ts`
Expected: FAIL (status filter mismatch)

Run: `bun test server/tests/user-login-status.test.ts`
Expected: FAIL (function missing)

Run: `bun test server/tests/eslint-config.test.ts`
Expected: FAIL (config missing typescript flag)

**Step 3: Commit**

```bash
git add server/tests/user-delete-data.test.ts server/tests/user-filter.test.ts server/tests/user-login-status.test.ts server/tests/eslint-config.test.ts
git commit -m "���աG�s�W���β����P ESLint �]�w�ˬd"
```

---

### Task 2: Update user model + auth behavior

**Files:**

- Modify: `server/src/models/user.ts`
- Modify: `server/src/controllers/auth.ts`

**Step 1: Implement minimal code**

- Remove `disabledReason` from `mapUserResponse` and `buildUserDeleteData`.
- Change `buildUserWhere` to `status: { not: 'DELETED' }`.
- Add `canLoginWithStatus(status: string)` and use it in `login`.
- Update login error message to reflect deletion (e.g. `user deleted`).

**Step 2: Run tests**

Run: `bun test server/tests/user-delete-data.test.ts server/tests/user-filter.test.ts server/tests/user-login-status.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add server/src/models/user.ts server/src/controllers/auth.ts
git commit -m "�ץ��G���������޿�ýվ�n�J�P�_"
```

---

### Task 3: Update Prisma schema + migration

**Files:**

- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/<timestamp>_remove_user_disabled/migration.sql`

**Step 1: Update schema**

- Remove `disabledReason` from `model User`.

**Step 2: Create migration (create-only)**

Run (from `server`):

```bash
bunx prisma migrate dev --create-only --name remove_user_disabled
```

**Step 3: Edit migration SQL**

Add an `UPDATE` to normalize status:

```sql
UPDATE "User" SET "status" = 'ACTIVE' WHERE "status" <> 'DELETED' OR "status" IS NULL;
```

**Step 4: Run tests**

Run: `bun test server/tests/schema-index.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/migrations
git commit -m "��Ʈw�G���� disabledReason �æ^�_�ϥΪ̪��A"
```

---

### Task 4: Fix ESLint config + deps + lint formatting

**Files:**

- Modify: `eslint.config.js`
- Modify: `package.json`
- Modify: `tests/api/kyc.spec.ts`
- Modify: `tests/api/tickets.spec.ts`

**Step 1: Update ESLint config**

- Add `typescript: true` (and TS config path if needed).
- Add devDependencies: `typescript`, `@typescript-eslint/parser`, `@typescript-eslint/eslint-plugin`.

**Step 2: Fix lint formatting**

- Resolve `antfu/consistent-list-newline` violations in the two test files.

**Step 3: Run lint**

Run: `pnpm run lint`
Expected: PASS

**Step 4: Commit**

```bash
git add eslint.config.js package.json tests/api/kyc.spec.ts tests/api/tickets.spec.ts
git commit -m "�ץ��G�j�� ESLint �ѪR TypeScript �íץ��榡"
```

---

### Task 5: Full verification + push

**Step 1: Run checks**

- `pnpm run lint`
- `bun test` (from `server`)

**Step 2: Final commit (if needed)**

```bash
git status -sb
```

**Step 3: Push**

```bash
git push -u origin fix/remove-disable-eslint
```
