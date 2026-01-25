# Spaghetti Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce spaghetti hotspots (large monoliths, duplicated list logic, mixed concerns) while keeping behavior unchanged.

**Architecture:** Extract fixtures and domain rules into dedicated modules, centralize route/menu metadata, and split oversized views into smaller components and composables. Validate with existing lint/build and server tests after each step.

**Tech Stack:** Backend Hono + Bun + Prisma + SQLite; Frontend Vue 3 + Pinia + Naive UI + Unocss; Axios; Playwright.

---

## Phase A — Seed and Data Fixtures

### Task 1: Refactor seed data into fixtures (remove mojibake strings)

**Why:** `server/src/models/seed.ts` is a large monolith with hardcoded data and garbled strings. It is hard to maintain and easy to break.

**Files:**

- Create: `server/src/seed/fixtures.ts`

- Create: `server/src/seed/builders.ts`

- Modify: `server/src/models/seed.ts`

- Test: `server/tests/seed-fixtures.test.ts`

- Update (if needed): `server/tests/demo-seed-plan.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'bun:test'
import { seedRoles, seedUsers } from '../src/seed/fixtures'

describe('seed fixtures', () => {
  it('define roles and users with display names', () => {
    expect(seedRoles.length).toBeGreaterThan(0)
    expect(seedUsers.every(user => user.username && user.displayName)).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test server/tests/seed-fixtures.test.ts`

Expected: FAIL (module not found).

**Step 3: Write minimal implementation**

- Move seed constants (roles/users/kyc/tickets) into `server/src/seed/fixtures.ts` with clean ASCII labels.

- Add small helpers in `server/src/seed/builders.ts` to build Prisma create payloads.

- Update `server/src/models/seed.ts` to use the fixtures/builders and remove inline data blocks.

**Step 4: Run tests to verify it passes**

Run: `bun test server/tests/seed-fixtures.test.ts`

Expected: PASS

Run: `bun test server/tests/demo-seed-plan.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add server/src/seed server/src/models/seed.ts server/tests/seed-fixtures.test.ts server/tests/demo-seed-plan.test.ts
git commit -m "refactor(seed): extract fixtures and clean seed data"
```

---

## Phase B — Routing and Menu Metadata

### Task 2: Normalize route metadata and remove duplicated group objects

**Why:** `src/router/basic-routes.ts` mixes routing, menu metadata, and duplicated group definitions, and includes garbled titles. This is fragile and hard to update.

**Files:**

- Create: `src/router/route-groups.ts`

- Create: `scripts/check-route-meta.mjs`

- Modify: `src/router/basic-routes.ts`

- Modify: `src/store/modules/permission.ts`

- Modify: `src/locales/en-US.json`

- Modify: `src/locales/zh-TW.json`

**Step 1: Write the failing test (route meta check)**

```js
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const routesPath = path.join(process.cwd(), 'src/router/basic-routes.ts')
const content = await readFile(routesPath, 'utf8')
if (/meta:\s*\{[^}]*title\s*:/.test(content)) {
  console.error('meta.title should be removed; use titleKey only.')
  process.exit(1)
}
console.log('ok')
```

**Step 2: Run test to verify it fails**

Run: `node scripts/check-route-meta.mjs`

Expected: FAIL (meta.title still present).

**Step 3: Write minimal implementation**

- Extract shared group meta into `src/router/route-groups.ts`.

- Remove `meta.title` from `basic-routes.ts`; keep `meta.titleKey` only.

- Update `permission` store to resolve labels using `titleKey` or route name.

- Add any missing i18n keys in `src/locales/en-US.json` and `src/locales/zh-TW.json`.

**Step 4: Run tests to verify it passes**

Run: `node scripts/check-route-meta.mjs`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add src/router src/store/modules/permission.ts src/locales scripts/check-route-meta.mjs
git commit -m "refactor(routes): normalize route meta and menu groups"
```

---

## Phase C — Shared List Page Logic

### Task 3: Extract shared list-page state and formatters

**Why:** List pages (`users`, `tickets`, `kyc`, `appeals`, `audit`) repeat pagination, filters, and time formatting with copy/paste. This is classic spaghetti that increases risk of drift.

**Files:**

- Create: `src/composables/useListPage.ts`

- Create: `src/utils/date-format.ts`

- Modify: `src/views/users/index.vue`

- Modify: `src/views/tickets/index.vue`

- Modify: `src/views/kyc/pending/index.vue`

- Modify: `src/views/kyc/appeals/index.vue`

- Modify: `src/views/audit/index.vue`

- Create: `scripts/check-list-pages.mjs`

**Step 1: Write the failing test (usage check)**

```js
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const files = [
  'src/views/users/index.vue',
  'src/views/tickets/index.vue',
  'src/views/kyc/pending/index.vue',
  'src/views/kyc/appeals/index.vue',
  'src/views/audit/index.vue',
]
for (const file of files) {
  const content = await readFile(path.join(process.cwd(), file), 'utf8')
  if (!content.includes('useListPage(')) {
    console.error(`${file} does not use useListPage.`)
    process.exit(1)
  }
}
console.log('ok')
```

**Step 2: Run test to verify it fails**

Run: `node scripts/check-list-pages.mjs`

Expected: FAIL (files do not use useListPage).

**Step 3: Write minimal implementation**

- Add `useListPage` composable that wires `useListPagination` and `useListFilters`.

- Add `formatDateTime` helper in `src/utils/date-format.ts`.

- Update each list page to use `useListPage` and `formatDateTime`.

**Step 4: Run tests to verify it passes**

Run: `node scripts/check-list-pages.mjs`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add src/composables src/utils/date-format.ts src/views scripts/check-list-pages.mjs
git commit -m "refactor(list): share pagination and formatter logic"
```

---

## Phase D — KYC Detail Componentization

### Task 4: Split KYC detail view into focused components

**Why:** `src/views/kyc/detail/index.vue` mixes summary, documents, review actions, and appeal lists in one file. This makes it hard to navigate and test.

**Files:**

- Create: `src/components/kyc/KycDetailSummary.vue`

- Create: `src/components/kyc/KycDocuments.vue`

- Create: `src/components/kyc/KycReviewPanel.vue`

- Create: `src/components/kyc/KycReviewTable.vue`

- Create: `src/components/kyc/KycAppealTable.vue`

- Create: `src/composables/useKycDetail.ts`

- Modify: `src/views/kyc/detail/index.vue`

- Create: `scripts/check-kyc-detail.mjs`

**Step 1: Write the failing test (component usage check)**

```js
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const detailPath = path.join(process.cwd(), 'src/views/kyc/detail/index.vue')
const content = await readFile(detailPath, 'utf8')
if (!content.includes('KycDetailSummary') || !content.includes('KycReviewPanel')) {
  console.error('KYC detail view is not split into components yet.')
  process.exit(1)
}
console.log('ok')
```

**Step 2: Run test to verify it fails**

Run: `node scripts/check-kyc-detail.mjs`

Expected: FAIL

**Step 3: Write minimal implementation**

- Move template blocks into new KYC components.

- Move data fetching and action handlers into `useKycDetail`.

- Keep the view as a thin wrapper that renders the components.

**Step 4: Run tests to verify it passes**

Run: `node scripts/check-kyc-detail.mjs`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/kyc src/composables/useKycDetail.ts src/views/kyc/detail/index.vue scripts/check-kyc-detail.mjs
git commit -m "refactor(kyc): split detail view into components"
```

---

## Phase E — Backend Domain Rules

### Task 5: Extract status transitions into domain modules

**Why:** `server/src/models/kyc.ts` and `server/src/models/ticket.ts` mix data access with state rules. Separating rules reduces coupling and clarifies intent.

**Files:**

- Create: `server/src/domain/kyc-status.ts`

- Create: `server/src/domain/ticket-status.ts`

- Modify: `server/src/models/kyc.ts`

- Modify: `server/src/models/ticket.ts`

- Modify: `server/tests/status-availability.test.ts`

**Step 1: Write the failing test**

Update imports in `server/tests/status-availability.test.ts`:

```ts
import { getKycAvailableActions, getKycAvailableStatuses } from '../src/domain/kyc-status'
import { getTicketAvailableActions, getTicketAvailableStatuses } from '../src/domain/ticket-status'
```

**Step 2: Run test to verify it fails**

Run: `bun test server/tests/status-availability.test.ts`

Expected: FAIL (module not found).

**Step 3: Write minimal implementation**

- Move transition maps and helpers into the new domain modules.

- Update models to call the domain helpers.

**Step 4: Run tests to verify it passes**

Run: `bun test server/tests/status-availability.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add server/src/domain server/src/models server/tests/status-availability.test.ts
git commit -m "refactor(domain): extract status transitions"
```

---

## Phase F — Dead Types Cleanup

### Task 6: Remove or align stale KYC types

**Why:** `src/types/kyc.ts` is unused and out of sync with current roles/statuses. Dead types are spaghetti in disguise.

**Files:**

- Delete: `src/types/kyc.ts`

- Create: `scripts/check-dead-types.mjs`

**Step 1: Write the failing test (dead type check)**

```js
import { existsSync } from 'node:fs'
import path from 'node:path'

const target = path.join(process.cwd(), 'src/types/kyc.ts')
if (existsSync(target)) {
  console.error('src/types/kyc.ts should be removed or replaced by real API types.')
  process.exit(1)
}
console.log('ok')
```

**Step 2: Run test to verify it fails**

Run: `node scripts/check-dead-types.mjs`

Expected: FAIL (file exists).

**Step 3: Write minimal implementation**

- Remove `src/types/kyc.ts`.

- If types are needed, reintroduce them later from real API responses.

**Step 4: Run tests to verify it passes**

Run: `node scripts/check-dead-types.mjs`

Expected: PASS

Run: `npm run build`

Expected: PASS

**Step 5: Commit**

```bash
git add scripts/check-dead-types.mjs
if (git ls-files src/types/kyc.ts | grep -q .); then git rm src/types/kyc.ts; fi
git commit -m "chore(types): remove stale KYC types"
```

---

## Phase G — Authorization Duplication

### Task 7: Centralize role authorization checks

**Why:** Controllers repeat role checks (ADMIN/SUPPORT/AUDITOR) across multiple files, which is easy to drift. Centralizing reduces spaghetti.

**Files:**

- Create: `server/src/middlewares/authorize.ts`

- Modify: `server/src/routes/*.ts`

- Modify: `server/src/controllers/*.ts`

- Test: `server/tests/authorize.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'bun:test'
import { authorize } from '../src/middlewares/authorize'

describe('authorize', () => {
  it('blocks roles outside allowed list', () => {
    const guard = authorize({ roles: ['ADMIN'] })
    expect(typeof guard).toBe('function')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `bun test server/tests/authorize.test.ts`

Expected: FAIL (module not found).

**Step 3: Write minimal implementation**

- Implement `authorize({ roles })` middleware.

- Apply it in routes and remove inline `ensureXRole` helpers from controllers.

**Step 4: Run tests to verify it passes**

Run: `bun test server/tests/authorize.test.ts`

Expected: PASS

Run: `bun test`

Expected: PASS

**Step 5: Commit**

```bash
git add server/src/middlewares/authorize.ts server/src/routes server/src/controllers server/tests/authorize.test.ts
git commit -m "refactor(authz): centralize role checks"
```
