# Staff Account Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Provide an admin-only account management flow that lists only staff accounts (ADMIN/SUPPORT/AUDITOR), supports create + soft-delete, and removes reset-password across frontend/back?�end.

**Architecture:** Add staff-only filtering in the user list query, add create/delete endpoints and soft-delete state, update auth to block deleted users, and update the Users UI to create/delete staff accounts with i18n updates. Tests are added for staff filtering and soft-delete helpers, plus a small frontend unit helper for role options.

**Tech Stack:** Vue 3 + Naive UI + Vite, Hono (Bun), Prisma (SQLite), Zod, Vitest (frontend unit tests), Bun test (server tests).

---

### Task 1: Staff-only list filter helper + tests

**Files:**

- Modify: `server/tests/user-filter.test.ts`
- Modify: `server/src/models/user.ts`

**Step 1: Write the failing test**

Update `server/tests/user-filter.test.ts` to reflect staff-only default:

```ext
import { describe, expect, it } from 'bun:test'
import { ROLE_CODES } from '../src/constants/roles'
import { buildUserWhere } from '../src/models/user'

describe('buildUserWhere', () => {
  it('defaults to staff-only and excludes deleted', () => {
    const where = buildUserWhere()

    expect(where).toMatchObject({
      status: { not: 'DELETED' },
      roles: {
        some: {
          role: { code: { in: [ROLE_CODES.ADMIN, ROLE_CODES.SUPPORT, ROLE_CODES.AUDITOR] } },
        },
      },
    })
  })

  it('can exclude staff when staffOnly is false', () => {
    const where = buildUserWhere({ staffOnly: false })

    expect(where).toMatchObject({
      status: { not: 'DELETED' },
      roles: {
        none: {
          role: { code: { in: [ROLE_CODES.ADMIN, ROLE_CODES.SUPPORT, ROLE_CODES.AUDITOR] } },
        },
      },
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/user-filter.test.ts`
Expected: FAIL because `buildUserWhere` is missing or returns the wrong role filter.

**Step 3: Write minimal implementation**

In `server/src/models/user.ts`, add:

```ext
import type { Prisma } from '@prisma/client'
import { ROLE_CODES } from '../constants/roles'

const STAFF_ROLE_CODES = [ROLE_CODES.ADMIN, ROLE_CODES.SUPPORT, ROLE_CODES.AUDITOR]

export function buildUserWhere({ status, keyword, staffOnly = true }: { status?: string; keyword?: string; staffOnly?: boolean } = {}): Prisma.UserWhereInput {
  const where: Prisma.UserWhereInput = {
    status: { not: 'DELETED' },
  }

  if (status && status !== 'DELETED') {
    where.status = status
  }
  if (keyword) {
    where.OR = [
      { username: { contains: keyword } },
      { displayName: { contains: keyword } },
    ]
  }

  where.roles = staffOnly
    ? { some: { role: { code: { in: STAFF_ROLE_CODES } } } }
    : { none: { role: { code: { in: STAFF_ROLE_CODES } } } }

  return where
}
```

Update `listUsers` to use `buildUserWhere({ status, keyword, staffOnly: true })`.

**Step 4: Run test to verify it passes**

Run: `bun test tests/user-filter.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/user-filter.test.ts server/src/models/user.ts
git commit -m "test: add staff-only user list filter helper"
```

---

### Task 2: Soft-delete helper + auth status guard

**Files:**

- Create: `server/tests/user-delete-data.test.ts`
- Modify: `server/src/models/user.ts`
- Modify: `server/src/controllers/auth.ts`

**Step 1: Write the failing test**

Create `server/tests/user-delete-data.test.ts`:

```ext
import { expect, test } from 'bun:test'
import { buildUserDeleteData } from '../src/models/user'

test('buildUserDeleteData marks user as deleted', () => {
  expect(buildUserDeleteData()).toEqual({
    status: 'DELETED',
    disabledReason: 'deleted',
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test tests/user-delete-data.test.ts`
Expected: FAIL because `buildUserDeleteData` does not exist.

**Step 3: Write minimal implementation**

In `server/src/models/user.ts`, add:

```ext
export function buildUserDeleteData() {
  return {
    status: 'DELETED',
    disabledReason: 'deleted',
  }
}
```

Update `server/src/controllers/auth.ts` login check:

```ext
if (user.status === 'DISABLED' || user.status === 'DELETED') {
  return fail(c, 403, 'user disabled', 403)
}
```

**Step 4: Run test to verify it passes**

Run: `bun test tests/user-delete-data.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/user-delete-data.test.ts server/src/models/user.ts server/src/controllers/auth.ts
git commit -m "test: add soft-delete helper and guard deleted logins"
```

---

### Task 3: User create + delete endpoints (schemas/controllers/routes/models)

**Files:**

- Modify: `server/tests/user-schema.test.ts`
- Modify: `server/src/schemas/user.ts`
- Modify: `server/src/models/user.ts`
- Modify: `server/src/controllers/user.ts`
- Modify: `server/src/routes/user.ts`

**Step 1: Write the failing test**

Extend `server/tests/user-schema.test.ts` to ensure delete schema requires adminPassword and create schema rejects ADMIN (if not already present):

```ext
it('requires admin password for deletion', () => {
  expect(userDeleteSchema.safeParse({ adminPassword: 'Aa123456' }).success).toBe(true)
  expect(userDeleteSchema.safeParse({}).success).toBe(false)
})
```

If `userCreateSchema`/`userDeleteSchema` are missing, this will fail immediately.

**Step 2: Run test to verify it fails**

Run: `bun test tests/user-schema.test.ts`
Expected: FAIL because schemas are missing/incorrect.

**Step 3: Write minimal implementation**

Update `server/src/schemas/user.ts`:

```ext
import { isCreatableRoleCode } from '../constants/roles'

export const userCreateSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  displayName: z.string().min(1),
  roleCode: z.string().refine(isCreatableRoleCode, { message: 'role not allowed' }),
})

export const userDeleteSchema = z.object({
  adminPassword: z.string().min(1),
})
```

Add model functions in `server/src/models/user.ts`:

```ext
export async function createUserAccount({ username, password, displayName, roleCode }: { username: string; password: string; displayName: string; roleCode: string }) {
  const passwordHash = await hashPassword(password)
  return prisma.user.create({
    data: {
      username,
      passwordHash,
      displayName,
      roles: {
        create: [{ role: { connect: { code: roleCode } } }],
      },
    },
  })
}

export async function deleteUserAccount(id: string) {
  return prisma.user.update({
    where: { id },
    data: buildUserDeleteData(),
  })
}
```

Update `server/src/controllers/user.ts`:

- Add `createUserAccountHandler` (ADMIN only) to call `createUserAccount` and write `USER_CREATE` audit log.
- Add `deleteUserAccountHandler` (ADMIN only) to verify `adminPassword` against current admin?�s passwordHash using `verifyPassword`, then call `deleteUserAccount` and write `USER_DELETE` audit log.
- Remove `resetUserPasswordHandler` and related payload interface.

Update `server/src/routes/user.ts`:

- Add `POST /users` with `validateJson(userCreateSchema)`
- Add `POST /users/:id/delete` with `validateJson(userDeleteSchema)`
- Remove `POST /users/:id/reset-password`

**Step 4: Run test to verify it passes**

Run: `bun test tests/user-schema.test.ts`
Expected: PASS.

**Step 5: Commit**

```bash
git add server/tests/user-schema.test.ts server/src/schemas/user.ts server/src/models/user.ts server/src/controllers/user.ts server/src/routes/user.ts
git commit -m "feat(server): add staff account create/delete endpoints"
```

---

### Task 4: Frontend role options helper + unit test

**Files:**

- Create: `tests/unit/useStaffRoleOptions.test.js`
- Create: `src/composables/useStaffRoleOptions.ts`
- Modify: `package.json` (add `vitest` dev dependency if missing)

**Step 1: Write the failing test**

Create `tests/unit/useStaffRoleOptions.test.js`:

```ext
import assert from 'node:assert/strict'
import test from 'vitest'
import { useStaffRoleOptions } from '../../src/composables/useStaffRoleOptions.ts'

test('useStaffRoleOptions returns support + auditor only', () => {
  const { roleOptions } = useStaffRoleOptions({
    t: (key) => key,
  })

  assert.deepEqual(
    roleOptions.value.map((option) => option.value),
    ['SUPPORT', 'AUDITOR'],
  )
})
```

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/useStaffRoleOptions.test.js`
Expected: FAIL because `useStaffRoleOptions` does not exist (or vitest missing).

**Step 3: Write minimal implementation**

Create `src/composables/useStaffRoleOptions.ts`:

```ext
import { computed } from 'vue'

export function useStaffRoleOptions({ t }: { t: (key: string) => string }) {
  const roleOptions = computed(() => ([
    { label: t('roles.SUPPORT'), value: 'SUPPORT' },
    { label: t('roles.AUDITOR'), value: 'AUDITOR' },
  ]))

  return { roleOptions }
}
```

Add `vitest` to `devDependencies` if missing.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/useStaffRoleOptions.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add tests/unit/useStaffRoleOptions.test.js src/composables/useStaffRoleOptions.ts package.json
git commit -m "test: add staff role options helper"
```

---

### Task 5: Frontend users page UI (create/delete, remove reset)

**Files:**

- Modify: `src/api/user.ts`
- Modify: `src/views/users/index.vue`
- Modify: `src/components/users/UserListCard.vue`
- Create: `src/components/users/UserCreateForm.vue`
- Create: `src/components/users/UserDeleteForm.vue`
- Modify: `src/locales/zh-TW.json`
- Modify: `src/locales/en-US.json`
- Modify: `src/router/basic-routes.ts`

**Step 1: Write the failing test**

Add a small assertion to `tests/unit/useStaffRoleOptions.test.js` that expects no `ADMIN` value (already implied). This should already be failing before changes in Task 4; if not, extend it with an explicit `assert.ok(!values.includes('ADMIN'))`.

**Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/useStaffRoleOptions.test.js`
Expected: FAIL (until Task 4 is done).

**Step 3: Write minimal implementation**

Frontend changes:

- `src/api/user.ts`: add `create`, `remove` (delete), remove `resetPassword`.
- `src/views/users/index.vue`: add create/delete modals + state, add action buttons (create + refresh), remove reset logic and modal.
- `src/components/users/UserListCard.vue`: remove reset button; add delete button.
- `src/components/users/UserCreateForm.vue`: form fields `username/password/displayName/roleCode` using `useStaffRoleOptions`.
- `src/components/users/UserDeleteForm.vue`: admin password input.
- `src/locales/zh-TW.json` + `src/locales/en-US.json`: new keys for create/delete and rename menu.Users to ?�帳?�管??Account Management?? remove reset text.
- `src/router/basic-routes.ts`: keep route name but update menu label via i18n key.

**Step 4: Run test to verify it passes**

Run: `npx vitest run tests/unit/useStaffRoleOptions.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add src/api/user.ts src/views/users/index.vue src/components/users/UserListCard.vue src/components/users/UserCreateForm.vue src/components/users/UserDeleteForm.vue src/locales/zh-TW.json src/locales/en-US.json src/router/basic-routes.ts
git commit -m "feat(ui): add staff account create/delete and remove reset"
```

---

### Task 6: Cleanup + consistency checks

**Files:**

- Remove: `src/components/users/UserResetForm.vue` (if unused)
- Remove: server reset password handlers/schema/route (if not already removed)
- Modify: `src/views/users/index.vue` imports to match removal

**Step 1: Verify no reset-password references**

Run: `rg -n "reset-password|resetPassword|UserReset" -S src server`

Expected: No matches (or only in changelog/notes if any).

**Step 2: Run lint + i18n checks**

Run: `pnpm run lint`
Expected: PASS (no new errors).

Run: `pnpm run check:i18n`
Expected: PASS.

**Step 3: Commit**

```bash
git add src/components/users/UserResetForm.vue src/views/users/index.vue server/src/controllers/user.ts server/src/routes/user.ts server/src/schemas/user.ts server/src/models/user.ts
git commit -m "chore: remove reset password flow"
```
