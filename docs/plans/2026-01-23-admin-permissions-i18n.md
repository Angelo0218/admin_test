# Admin Permissions + i18n + UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 修正編譯錯/亂碼，改成前端角色對應權限池 + 後端保護資料，並補上 Playwright（E2E + API）測試覆蓋。全站文字改為 i18n（繁中/英文），註解使用繁體中文。

**Architecture:** 前端以靜態路由 + 角色過濾生成選單與權限池；後端仍維持資料存取保護。i18n 為單一文字來源；UI 不再依賴 DB 文案。

**Tech Stack:** Vue 3 + Pinia + Naive UI + vue-i18n + Playwright + Bun/Hono

---

### Task 1: 建立 Playwright 測試（先寫測試，確保紅燈）

**Files:**

- Create: `playwright.config.ts`
- Create: `tests/api/auth.spec.ts`
- Create: `tests/api/kyc.spec.ts`
- Create: `tests/api/tickets.spec.ts`
- Create: `tests/api/users.spec.ts`
- Create: `tests/api/roles-audit.spec.ts`
- Create: `tests/e2e/admin.spec.ts`
- Modify: `package.json` (新增 `@playwright/test` 以及 `test:e2e` script)

**Step 1: 寫 API 測試（Auth + Permissions）**

```ts
import { expect, test } from '@playwright/test'

test('login + user detail + permissions tree', async ({ request }) => {
  const loginRes = await request.post('/api/v1/auth/login', { data: { username: 'admin', password: '123456' } })
  expect(loginRes.ok()).toBeTruthy()
  const { data } = await loginRes.json()
  const token = data.accessToken

  const userRes = await request.get('/api/v1/user/detail', { headers: { Authorization: `Bearer ${token}` } })
  expect(userRes.ok()).toBeTruthy()

  const permRes = await request.get('/api/v1/role/permissions/tree', { headers: { Authorization: `Bearer ${token}` } })
  expect(permRes.ok()).toBeTruthy()
})
```

**Step 2: 寫 API 測試（KYC / Tickets / Users / Roles / Audit）**

- KYC list + detail + review invalid/valid 狀態
- Ticket list + detail + update status invalid/valid
- Users list, Roles list, Audit list

**Step 3: 寫 E2E 測試（登入 + 主要頁面）**

- 驗證中文介面可正常顯示（不含 ????）
- 驗證 KYC/Ticket 列表按鈕可見
- 驗證詳情頁不出現在 AppTab

**Step 4: 執行測試確認紅燈**

- `npm run test:e2e`（預期失敗，作為紅燈）

---

### Task 2: 修正所有非法註解與亂碼（編譯可通過）

**Files:**

- Modify: 所有 `.vue` 有 `<!-----` 的檔案
- Modify: `src/router/basic-routes.js`
- Modify: `server/src/models/permission.ts`
- Modify: `server/src/models/seed.ts`
- Modify: `src/layouts/components/RoleSelect.vue`
- Modify: `src/components/common/LayoutSetting.vue`, `ThemeSetting.vue`, `TheFooter.vue`, `MeModal`

**Step 1: 將 `<!-----` 改成 `<!-- -->` 或移除**
**Step 2: 修正中文亂碼/未閉合字串**
**Step 3: 重新存檔為 UTF‑8**

---

### Task 3: 前端權限池改為角色對應（不依賴後端 tree）

**Files:**

- Create: `src/router/permission-tree.js`
- Modify: `src/store/modules/permission.js`
- Modify: `src/router/guards/permission-guard.js`
- Modify: `src/store/helper.js`

**Step 1: 建立前端權限樹（含 roles、icon、path、children）**
**Step 2: permission store 改用前端樹 + 角色過濾生成選單**
**Step 3: guard 僅取 userInfo + 角色比對 + 回退**

---

### Task 4: 全站 i18n 化 + 文案統一（繁中/英文）

**Files:**

- Modify: `src/locales/zh-TW.json`, `src/locales/en-US.json`
- Modify: 所有 views/components 中的靜態文案

**Step 1: 補齊缺少的 key（logout、toggle role、Layout/Theme 等）**
**Step 2: 將各頁面/元件文字改用 `t()`**
**Step 3: 狀態/分類/角色顯示改用 i18n（不依賴 DB name）**

---

### Task 5: 狀態轉移前端 guard + 註解（繁中）

**Files:**

- Modify: `src/views/kyc/detail/index.vue`
- Modify: `src/views/tickets/detail/index.vue`

**Step 1: 集中狀態對應表**
**Step 2: 按狀態開關按鈕，避免 400**
**Step 3: 註解改為繁體中文**

---

### Task 6: 完整測試（API + E2E）

**Commands:**

- `npx playwright install`
- `npm run test:e2e`

---

### Task 7: 代碼審查與整理

**Steps:**

- `git status` + `git diff`
- 檢查中文編碼（UTF‑8）
- 確認註解繁中

---

> 若你要我在目前工作區直接執行，我會在此工作區完成（不另開 worktree）。
