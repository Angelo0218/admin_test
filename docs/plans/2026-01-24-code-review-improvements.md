# Code Review Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 以分階段方式修復安全性、穩定性、效能與可維護性問題，並標註已驗證與待驗證項目。

**Architecture:** 先清理阻塞與高風險問題，再依嚴重度分批修復；每項修復皆附最小測試與可回溯 commit。

**Tech Stack:** Backend Hono + Bun + Prisma + SQLite；Frontend Vue 3 + Pinia + Naive UI + Unocss；Axios；Playwright。

---

## Scope & Assumptions

- 需求來源：使用者提供之審查清單 + 現場程式碼驗證。
- 資料量小，前端可自行篩選/搜尋/排序；不新增後端篩選或游標分頁（除非需求變更）。
- 後端專注資料/安全/權限；前端專注介面與互動。
- 不在後端保留前端 UI 結構（選單/路由/文字）；無實際消費者的 UI API 會移除。
- 內容標註：
  - **[Verified]**：已在現有程式碼找到證據
  - **[To-Verify]**：尚未驗證、需先確認
- 文件用途：AI 依計畫逐步修改檔案。
- 本計畫不包含「總體評分」。

## Evidence Status

### Verified

- 明文密碼比對與存儲：`server/src/controllers/auth.ts:17-22`、`server/src/models/user.ts:159-164`
- Seed 明文密碼：`server/src/models/seed.ts:70-110`
- 角色權限更新未持久化（僅回傳 payload）：`server/src/controllers/role.ts:40-56`
- 記住我會把密碼存入 localStorage：`src/views/login/index.vue:89-109`
- JWT Secret 預設 `dev-secret`：`server/src/config/env.ts:3-8`
- CORS 預設 `*` 且 credentials=true：`server/src/config/env.ts:3-9`、`server/src/index.ts:17`
- Refresh token cookie 缺 `secure`/`maxAge`：`server/src/controllers/auth.ts:42-46`
- Error handler 直接回傳 `err.message`：`server/src/middlewares/error.ts:4-9`
- 登入驗證僅 `min(1)`：`server/src/schemas/auth.ts:3-6`
- 缺少 rate limit：`server/src/index.ts:15-21`（僅 cors/logger）
- HTTP 攔截器存在但無 refresh 自動重試：`src/utils/http/interceptors.js:1-58`
- 權限快取 TTL 5 分鐘：`server/src/models/permission.ts:112-149`
- 權限樹與 seed 字串壞檔導致 TS 可能無法編譯：
  - `server/src/models/permission.ts:20-36`（字串未閉合）
  - `server/src/models/seed.ts:64-75`（字串未閉合）
- 角色常量前後端重複：`server/src/constants/roles.ts`、`src/constants/roles.js`
- 狀態轉移規則前後端重複：`server/src/models/kyc.ts`、`server/src/models/ticket.ts`、`src/constants/status.js`
- 前端硬編碼狀態字串：`src/views/kyc/pending/index.vue`、`src/views/kyc/detail/index.vue`、`src/views/tickets/detail/index.vue`
- 後端提供 UI 權限樹 API 但前端未使用：`server/src/routes/permission.ts`、`server/src/controllers/permission.ts`

### To-Verify

- 路由是否全部動態 import（lazy-load）
- KeepAlive 實際使用狀況與覆蓋範圍
- 其他模組是否存在 N+1 查詢
- 索引需求是否與實際查詢條件一致
- 圖片壓縮/預加載策略是否已有配置
- 是否已有 HTTPS/HSTS/CSP/X-Frame-Options 配置

---

## Phase A — Blocking / High (立即修復)

### Task 1: 修復 permission/seed 字串壞檔（Blocking）

**Files:**

- Modify: `server/src/models/permission.ts:20-36`
- Modify: `server/src/models/seed.ts:64-75`

**Step 1: Write the failing test**

```bash
bunx tsc -p server/tsconfig.json
```

**Step 2: Run test to verify it fails**
Expected: TypeScript parse error / unterminated string.

**Step 3: Write minimal implementation**

- 修正未閉合字串為可編譯文字（必要時以簡短占位字替換）。
- 若 Task 10 決定移除 permission 模組，可改為直接刪除相關檔案並更新引用。

**Step 4: Run tests to verify it passes**
Run: `bunx tsc -p server/tsconfig.json`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/models/permission.ts server/src/models/seed.ts
git commit -m "修復 seed/permission 字串壞檔"
```

### Task 2: 密碼雜湊與登入驗證（bcrypt/argon2）

**Files:**

- Create: `server/src/utils/password.ts`
- Modify: `server/src/controllers/auth.ts:17-48`
- Modify: `server/src/controllers/user.ts:134-157`
- Modify: `server/src/models/user.ts:159-164`
- Test: `server/tests/password.test.ts`

**Step 1: Write the failing test**

```text
import { hashPassword, verifyPassword } from '../src/utils/password'

test('hash and verify password', async () => {
  const plain = 'P@ssw0rd!'
  const hash = await hashPassword(plain)
  expect(hash).not.toBe(plain)
  expect(await verifyPassword(plain, hash)).toBe(true)
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/password.test.ts`
Expected: FAIL (module not found)

**Step 3: Write minimal implementation**

- 新增 `hashPassword/verifyPassword`（選用 bcrypt 或 argon2，確保 Bun 相容）
- `login` 由明文比對改為 `verifyPassword`
- `createUser` 儲存時改為雜湊
- 刪除帳號時 `adminPassword` 改為雜湊比對

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/password.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/utils/password.ts server/src/controllers/auth.ts server/src/models/user.ts server/tests/password.test.ts
git commit -m "改用密碼雜湊並更新登入驗證"
```

### Task 3: 記住我不要保存密碼（只記帳號）

**Files:**

- Modify: `src/views/login/index.vue:89-109`
- Modify: `src/utils/storage/index.js`（如需調整儲存 key）

**Step 1: Write the failing test**

```text
// pseudo/e2e: 勾選記住我後 localStorage 不應包含 password
```

**Step 2: Run test to verify it fails**
Run: `npm run test:e2e`（或手動驗證）
Expected: localStorage 仍含 password

**Step 3: Write minimal implementation**

- `loginInfo` 僅保存 username
- 讀取時只回填 username，password 保持空值
- 取消記住我時清除該 key

**Step 4: Run tests to verify it passes**
Run: `npm run test:e2e`（或手動驗證）
Expected: localStorage 不含 password

**Step 5: Commit**

```bash
git add src/views/login/index.vue src/utils/storage/index.js
git commit -m "記住我只保存帳號"
```

### Task 4: Seed 密碼雜湊 + 只在允許時啟動

**Files:**

- Modify: `server/src/models/seed.ts:58-110`
- Modify: `server/src/index.ts:33-35`
- Modify: `server/src/config/env.ts:1-10`
- Create: `server/.env.example`

**Step 1: Write the failing test**

```text
test('seed should not run without ENABLE_SEED', async () => {
  // pseudo: call seedDefaults and expect no-op when env not set
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/seed.test.ts`
Expected: FAIL (seed runs without flag)

**Step 3: Write minimal implementation**

- `seedDefaults()` 只有 `ENABLE_SEED=true` 才執行
- seed 內密碼改為 `hashPassword()`
- `.env.example` 補上 `JWT_SECRET`、`CORS_ORIGIN`、`ENABLE_SEED`

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/seed.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/models/seed.ts server/src/index.ts server/src/config/env.ts server/.env.example
git commit -m "限制 seed 執行並雜湊預設密碼"
```

### Task 5: JWT Secret 強制設定

**Files:**

- Modify: `server/src/config/env.ts:3-8`
- Modify: `server/.env`
- Modify: `server/.env.example`

**Step 1: Write the failing test**

```text
test('JWT_SECRET is required in production', () => {
  // pseudo: set NODE_ENV=production without JWT_SECRET
  // expect throw
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/env.test.ts`
Expected: FAIL (no throw)

**Step 3: Write minimal implementation**

- Production/CI 環境缺 JWT_SECRET 直接拋錯
- 移除 `dev-secret` 預設值
- `server/.env` 移出明文 secret，改示例於 `.env.example`

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/env.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/config/env.ts server/.env server/.env.example
git commit -m "生產環境強制 JWT_SECRET"
```

### Task 6: CORS 收斂 + Refresh Cookie 安全屬性

**Files:**

- Modify: `server/src/config/env.ts:3-9`
- Modify: `server/src/index.ts:15-18`
- Modify: `server/src/controllers/auth.ts:42-46`

**Step 1: Write the failing test**

```text
test('cors rejects unknown origin', async () => {
  // pseudo: call cors with disallowed origin, expect 403/blocked
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/cors.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- `CORS_ORIGIN` 支援多值白名單（逗號分隔）
- origin 不在白名單時拒絕
- refresh cookie 加上 `secure`, `maxAge`, `sameSite`（依環境設定）

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/cors.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/config/env.ts server/src/index.ts server/src/controllers/auth.ts
git commit -m "收斂 CORS 並強化 refresh cookie"
```

---

## Phase B — Medium (近期修復)

### Task 7: Rate Limit 防暴力破解

**Files:**

- Create: `server/src/middlewares/rate-limit.ts`
- Modify: `server/src/routes/auth.ts:1-12`
- Modify: `server/src/index.ts:15-18`

**Step 1: Write the failing test**

```text
test('login is rate limited', async () => {
  // pseudo: send N+1 login attempts within window, expect 429
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/rate-limit.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- in-memory rate limit（後續可換 Redis）
- 對 `/auth/login` 先行套用

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/rate-limit.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/middlewares/rate-limit.ts server/src/routes/auth.ts server/src/index.ts
git commit -m "加入登入限流"
```

### Task 8: 移除前端角色頁面與路由（已選 B）

**Files:**

- Delete: `src/views/roles/index.vue`
- Modify: `src/router/permission-tree.js`（移除 Roles 節點）
- Modify: `src/router/basic-routes.js`（移除 /roles 路由）
- Modify: `src/api/role.js`（若無引用則刪除）
- Modify: `src/locales/en-US.json`、`src/locales/zh-TW.json`（移除 rolesPage 文案）

**Step 1: Write the failing test**

```bash
rg "rolesPage|/roles|views/roles" src
```

**Step 2: Run test to verify it fails**
Expected: 仍找到角色頁相關引用

**Step 3: Write minimal implementation**

- 刪除角色頁檔案與路由/選單節點
- 移除對角色頁與 role API 的前端引用
- 清掉 rolesPage i18n 文案（避免殘留）

**Step 4: Run tests to verify it passes**

```bash
rg "rolesPage|/roles|views/roles" src
```

Expected: 無任何引用

**Step 5: Commit**

```bash
git add src/router src/views src/api src/locales
git commit -m "移除前端角色頁面與路由"
```

### Task 9: 狀態轉移規則單一來源（後端回傳可用動作）

**Files:**

- Modify: `server/src/models/kyc.ts`
- Modify: `server/src/models/ticket.ts`
- Modify: `server/src/controllers/kyc.ts`（或 `getApplicationDetail` 回傳結構）
- Modify: `server/src/controllers/ticket.ts`（或 `getTicketDetail` 回傳結構）
- Modify: `src/views/kyc/detail/index.vue`
- Modify: `src/views/tickets/detail/index.vue`
- Modify/Delete: `src/constants/status.js`（若無其他使用）

**Step 1: Write the failing test**

```text
// pseudo: detail API 應回傳 availableActions / availableStatuses
```

**Step 2: Run test to verify it fails**
Expected: API 回傳缺少可用動作欄位

**Step 3: Write minimal implementation**

- 後端 detail 回傳 `availableActions` / `availableStatuses`
- 前端改用回傳欄位判斷按鈕狀態
- 移除前端 transitions 常數與硬編碼依賴

**Step 4: Run tests to verify it passes**
Run: 手動驗證詳情頁按鈕與狀態顯示
Expected: 與後端規則一致

**Step 5: Commit**

```bash
git add server/src/models server/src/controllers src/views src/constants
git commit -m "狀態轉移由後端提供，前端改用回傳欄位"
```

### Task 10: 後端移除 UI 權限樹 API（若無外部使用）

**Step 0: 決策**

- 若無其他客戶端使用 `/role/permissions/tree` 或 `/permission/menu/validate`：移除
- 若仍有使用：保留並標註用途

**Files (移除路線):**

- Delete: `server/src/routes/permission.ts`
- Delete: `server/src/controllers/permission.ts`
- Delete: `server/src/models/permission.ts`
- Delete: `server/src/schemas/permission.ts`
- Modify: `server/src/index.ts`（移除 permissionRoutes）
- Modify/Delete: `server/tests/permission.test.ts`

**Step 1: Write the failing test**

```bash
rg "permissionRoutes|getPermissionTree|validateMenuPath" server/src
```

**Step 2: Run test to verify it fails**
Expected: 仍有 permission API 相關引用

**Step 3: Write minimal implementation**

- 移除 permission API 與相關檔案
- 保留控制器內的 role 驗證（不影響現有權限檢查）

**Step 4: Run tests to verify it passes**

```bash
rg "permissionRoutes|getPermissionTree|validateMenuPath" server/src
```

Expected: 無引用

**Step 5: Commit**

```bash
git add server/src server/tests
git commit -m "移除後端 UI 權限樹 API"
```

### Task 11: 錯誤處理 + 結構化日誌

**Files:**

- Modify: `server/src/middlewares/error.ts:4-9`
- Modify: `server/src/index.ts:15-21`
- Create: `server/src/utils/logger.ts`
- Create: `server/src/middlewares/request-id.ts`

**Step 1: Write the failing test**

```text
test('errors are masked in production', () => {
  // pseudo: simulate Error and expect generic message
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/error.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- 生產環境改回傳固定訊息與錯誤碼
- 加入 requestId 串接結構化日誌（pino/winston）

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/error.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/middlewares/error.ts server/src/index.ts server/src/utils/logger.ts server/src/middlewares/request-id.ts
git commit -m "結構化日誌與安全錯誤回應"
```

### Task 12: 強化輸入驗證（登入）

**Files:**

- Modify: `server/src/schemas/auth.ts:3-6`
- Modify: `server/src/middlewares/validate.ts:4-22`

**Step 1: Write the failing test**

```text
test('login rejects weak username/password', () => {
  // pseudo: expect schema to reject invalid input
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/schema-auth.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- 增加 maxLength/regex
- 若需要，增加 trim/normalize

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/schema-auth.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/schemas/auth.ts server/src/middlewares/validate.ts
git commit -m "強化登入輸入驗證"
```

### Task 13: 簡化 Refresh Token 解析邏輯

**Files:**

- Modify: `server/src/controllers/auth.ts:51-59`

**Step 1: Write the failing test**

```text
test('refresh token is read from cookie', () => {
  // pseudo: ensure getCookie path is used
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/auth-refresh.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- 改用 `getCookie` 統一取得
- 移除多層字串處理

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/auth-refresh.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/controllers/auth.ts
git commit -m "簡化 refresh token 解析"
```

---

## Phase C — Low (優化)

### Task 14: 安全標頭（HSTS/CSP/X-Frame-Options）

**Files:**

- Create: `server/src/middlewares/security-headers.ts`
- Modify: `server/src/index.ts:15-18`

**Step 1: Write the failing test**

```text
test('security headers are present', () => {
  // pseudo: expect CSP, HSTS, X-Frame-Options
})
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/security-headers.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- 設定 CSP、HSTS（僅 HTTPS）、X-Frame-Options

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/security-headers.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/middlewares/security-headers.ts server/src/index.ts
git commit -m "新增安全標頭"
```

---

## Performance & Architecture Improvements（可選 / 資料量成長再做）

### Task 15: 資料庫索引與查詢優化（可選，資料量成長再做）

**Files:**

- Modify: `server/prisma/schema.prisma:10-128`
- Modify: `server/src/models/*.ts`

**Step 1: Write the failing test**

```bash
# Baseline: record slow queries with prisma log
```

**Step 2: Run test to verify it fails**
Expected: 觀察到慢查詢

**Step 3: Write minimal implementation**

- 先維持既有 skip/take；資料量成長再評估 cursor-based pagination
- 若查詢變慢，再補 status/createdAt 等索引

**Step 4: Run tests to verify it passes**
Run: `bunx prisma migrate dev` + 基本列表查詢
Expected: 查詢時間下降

**Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/src/models
git commit -m "索引與分頁優化"
```

### Task 16: 前端效能檢視與資產優化（待驗證）

**Files:**

- Modify: `vite.config.js`
- Modify: `package.json`
- Modify: `src/assets/*`

**Step 1: Write the failing test**

```bash
npm run build
```

**Step 2: Run test to verify it fails**
Expected: 無 bundle report / 無圖片優化

**Step 3: Write minimal implementation**

- 啟用 rollup-visualizer
- 加入圖片壓縮流程
- 預加載關鍵資源

**Step 4: Run tests to verify it passes**
Run: `npm run build`
Expected: 有 bundle 分析與資產壓縮輸出

**Step 5: Commit**

```bash
git add vite.config.js package.json src/assets
git commit -m "前端資產與效能優化"
```

---

## Frontend / Code Quality Improvements

### Task 17: Axios 自動 refresh token + 重試

**Files:**

- Modify: `src/utils/http/interceptors.js:1-58`
- Modify: `src/api/index.js:1-7`

**Step 1: Write the failing test**

```text
// pseudo: mock 401 response and expect refresh + retry
```

**Step 2: Run test to verify it fails**
Run: `npm run test` (or add unit test runner)
Expected: FAIL

**Step 3: Write minimal implementation**

- 401 時呼叫 refresh
- refresh 成功後重試原請求
- refresh 失敗則登出

**Step 4: Run tests to verify it passes**
Run: `npm run test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/utils/http/interceptors.js src/api/index.js
git commit -m "Axios 自動 refresh 與重試"
```

### Task 18: 前端 TypeScript 轉換（中長期）

**Files:**

- Modify: `tsconfig.json`
- Rename: `src/**/*.js` -> `src/**/*.ts`

**Step 1: Write the failing test**

```bash
npm run build
```

**Step 2: Run test to verify it fails**
Expected: TS 錯誤

**Step 3: Write minimal implementation**

- 先遷移核心 API/HTTP 模組
- 逐步補型別與 JSDoc

**Step 4: Run tests to verify it passes**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add tsconfig.json src
git commit -m "啟動前端 TypeScript 轉換"
```

---

## Testing & CI (建議)

### Task 19: 補齊測試與 CI

**Files:**

- Create: `server/tests/*`
- Modify: `server/package.json`
- Modify: `.github/workflows/ci.yml`

**Step 1: Write the failing test**

```bash
bun test
npm run test:e2e
```

**Step 2: Run test to verify it fails**
Expected: 測試未覆蓋或腳本不存在

**Step 3: Write minimal implementation**

- 補上 auth/user/kyc/ticket 的基本測試
- 增加 CI 觸發 lint + test

**Step 4: Run tests to verify it passes**
Run: `bun test` + `npm run test:e2e`
Expected: PASS

**Step 5: Commit**

```bash
git add server/tests server/package.json .github/workflows/ci.yml
git commit -m "補齊測試與 CI"
```

---

## Contract & Data Integrity（低優先）

### Task 20: 角色代碼契約化（前後端一致性）

**Files:**

- Create: `docs/contracts/roles.md`
- (Optional) Modify: `server/src/constants/roles.ts`、`src/constants/roles.js`（補註解）

**Step 1: Write the failing test**

```md
// 文件缺少角色代碼契約
```

**Step 2: Run test to verify it fails**
Expected: 無單一契約文件可對照

**Step 3: Write minimal implementation**

- 建立契約文件列出 role codes
- 明確標註前後端需同步更新

**Step 4: Run tests to verify it passes**
Expected: 有明確契約文件可對照

**Step 5: Commit**

```bash
git add docs/contracts/roles.md
git commit -m "新增角色代碼契約文件"
```

### Task 21: Prisma 狀態 enum 化（可選）

**Files:**

- Modify: `server/prisma/schema.prisma`
- Modify: `server/src/models/kyc.ts`
- Modify: `server/src/models/ticket.ts`
- Modify: `server/src/models/user.ts`
- (Optional) Modify: `server/src/schemas/*.ts`

**Step 1: Write the failing test**

```bash
bunx prisma validate
```

**Step 2: Run test to verify it fails**
Expected: 尚未定義 enum

**Step 3: Write minimal implementation**

- 新增 `enum KycStatus`, `enum TicketStatus`, `enum UserStatus`
- 更新 model 欄位型別並執行 migrate

**Step 4: Run tests to verify it passes**
Run: `bunx prisma validate`
Expected: PASS

**Step 5: Commit**

```bash
git add server/prisma/schema.prisma server/src/models
git commit -m "Prisma 狀態 enum 化"
```
