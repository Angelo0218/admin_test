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
- 路由皆使用動態 import（lazy-load）：`src/router/basic-routes.js:1-149`
- KeepAlive 已落地且由 tab store 控制：`src/App.vue:9-58`、`src/router/guards/tab-guard.js:5-19`、`src/store/modules/tab.js:4-46`
- 查無明顯 N+1 查詢模式（list/detail 使用 include + transaction）：`server/src/models/kyc.ts:51-188`、`server/src/models/ticket.ts:57-140`
- Prisma schema 除 PK/unique 外無索引：`server/prisma/schema.prisma:10-128`
- Vite 未配置圖片壓縮/預載或 bundle 分析插件：`vite.config.js:19-69`
- 未見 HSTS/CSP/X-Frame-Options 中介層：`server/src/index.ts:1-23`
- 前端 routes 與 permission tree 雙來源：`src/router/basic-routes.js:1-149`、`src/router/permission-tree.js:1-126`、`src/store/modules/permission.js:1-66`
- 後端仍維護 permission tree 與前端重複：`server/src/models/permission.ts:19-155`、`src/router/permission-tree.js:1-126`
- i18n/路由標題出現亂碼（疑似編碼問題）：`src/locales/zh-TW.json:1-200`、`src/router/basic-routes.js:7-126`、`src/router/permission-tree.js:4-116`
- API 層散落與重複定義：`src/views/login/api.js:1-6`、`src/api/index.js:1-7`
- 後端角色檢查重複分散：`server/src/controllers/user.ts:13-107`、`server/src/controllers/kyc.ts:14-20`、`server/src/controllers/role.ts:5-36`
- 頁面檔案偏大（>200 行）：`src/views/users/index.vue`、`src/views/tickets/index.vue`、`src/views/kyc/detail/index.vue`
- 腳本檢查存在但未接入 scripts/CI：`scripts/check-i18n.mjs`、`scripts/check-kyc-ui.mjs`、`scripts/check-language-menu.mjs`、`package.json:6-15`
- i18n 檢查腳本目前失敗（缺 `messages['zh']` alias）：`scripts/check-i18n.mjs:18-20`、`src/locales/index.js:1-14`
- 路由/權限樹已覆蓋所有 views（未發現未掛載頁面）：`src/router/basic-routes.js:1-149`、`src/router/permission-tree.js:1-126`
- 前端權限菜單由 `frontendPermissionTree` 計算，未呼叫後端 permission API：`src/store/modules/permission.js:1-66`、`server/src/controllers/permission.ts:1-18`
- Vite `pluginPagePathes` 無 `isme:page-pathes` 使用點（可能無效配置）：`build/plugin-isme/page-pathes.js:1-22`、`vite.config.js:19-37`

### To-Verify

- 修正 i18n alias 後，重跑 `scripts/check-i18n.mjs` 以產出缺漏/未使用 key 清單

---

## Phase A — Blocking / High (立即修復)

### Task 1: 修復 permission/seed 字串壞檔（Blocking）

**Why:** TS 解析錯誤會阻塞後續修復與 CI。
**What:** 修正未閉合字串或移除已淘汰的 permission 檔案。
**Impact:** 建置可通過，後續任務可進行。

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

**Why:** 明文儲存/比對密碼有高風險。
**What:** 封裝 hash/verify 並替換登入與帳號刪除時的比對流程。
**Impact:** 密碼安全提升，降低外洩風險。

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

**Why:** localStorage 存密碼易被 XSS 或外掛讀取。
**What:** 記住我只保存 username，取消時清除對應 key。
**Impact:** 降低憑證洩漏與法遵風險。

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

**Why:** Seed 預設啟動與明文密碼會誤寫資料、暴露帳密。
**What:** 只在 ENABLE_SEED 啟動並改用 hash 產生密碼。
**Impact:** 避免誤植/外洩，部署更安全。

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

**Why:** dev-secret 讓 JWT 可被偽造，風險過高。
**What:** 生產/CI 必填 JWT_SECRET，移除預設值。
**Impact:** 配置錯誤可早期失敗，避免弱密鑰上線。

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

**Why:** CORS 放太寬 + credentials 會放大跨站風險，cookie 缺安全屬性。
**What:** 只允許白名單來源，補上 secure/maxAge/sameSite。
**Impact:** 降低 CSRF 與 refresh token 外洩風險。

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

**Why:** 登入端點易被暴力嘗試。
**What:** 加入簡單 rate limit（後續可換 Redis）。
**Impact:** 明顯降低暴力破解成功率。

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

**Why:** 角色頁若不在 scope 或後端未支援完整管理，會造成前後端責任混亂與誤導使用。
**What:** 移除角色頁/路由/API/i18n 相關引用。
**Impact:** UI 聚焦既有流程，維護成本降低且權限邏輯更一致。

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

**Why:** 狀態轉移規則前後端重複易不一致。
**What:** 後端回傳可用動作/狀態，前端只呈現與限制操作。
**Impact:** 單一來源降低錯誤率。

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

**Why:** 後端不應承載前端 UI 結構，且未使用的 API 增加維護與攻擊面。
**What:** 確認無客戶端依賴後移除 permission API 與檔案。
**Impact:** 邊界清楚、表面積縮小。

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

**Why:** 直接回傳 `err.message` 可能洩漏內部資訊；缺 requestId 難追查。
**What:** 生產環境隱藏細節，加入 requestId 與結構化日誌。
**Impact:** 安全性與可觀測性提升。

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

**Why:** 目前驗證過弱，垃圾/攻擊輸入易通過。
**What:** 加強長度/格式/正規化規則。
**Impact:** 提前擋下無效與風險請求。

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

**Why:** refresh token 解析分散且易出錯。
**What:** 統一用 `getCookie`，移除多層字串處理。
**Impact:** 降低刷新失敗與隱性 bug。

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

**Why:** 缺少安全標頭會增加 XSS/點擊劫持風險。
**What:** 加入 CSP、HSTS（HTTPS 時）、X-Frame-Options。
**Impact:** 基礎安全硬化。

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

**Why:** 資料量成長時，查詢效能會成為瓶頸。
**What:** 依實際查詢條件補索引，維持既有分頁策略。
**Impact:** 延後效能瓶頸出現時間。

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

**Why:** bundle/圖片未優化會拖慢首屏。
**What:** 加入 bundle 分析、圖片壓縮與資源預載。
**Impact:** 載入速度與互動體驗提升。

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

**Why:** 401 無自動刷新會中斷流程，造成重登與錯誤率上升。
**What:** 攔截 401 觸發 refresh，成功後重試原請求。
**Impact:** 認證流程更順暢。

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

**Why:** 純 JS 易累積型別不一致與維護成本。
**What:** 分段遷移，先核心 API/HTTP 模組。
**Impact:** 型別安全逐步提升。

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

**Why:** 缺測試與 CI 容易回歸且無法自動驗證品質。
**What:** 補基礎測試與 CI 流程（lint/test）。
**Impact:** 可重現驗證，降低回歸風險。

**Files:**

- Create: `server/tests/*`
- Modify: `package.json`
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
- 加入 `check:i18n`/`check:kyc-ui`/`check:language-menu` 並在 CI 執行

**Step 4: Run tests to verify it passes**
Run: `bun test` + `npm run test:e2e` + `npm run check:i18n`
Expected: PASS

**Step 5: Commit**

```bash
git add server/tests package.json server/package.json .github/workflows/ci.yml
git commit -m "補齊測試與 CI"
```

---

## Contract & Data Integrity（低優先）

### Task 20: 角色代碼契約化（前後端一致性）

**Why:** 角色碼前後端重複定義易漂移。
**What:** 建立契約文件並明確同步規則。
**Impact:** 角色一致性可被查核。

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

**Why:** 狀態字串自由輸入容易污染資料。
**What:** 用 Prisma enum 限制狀態值並同步模型。
**Impact:** 資料完整性與可維護性提升。

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

---

## Readability & Maintainability（可選）

### Task 22: 清理未使用路由/頁面/API/常數

**Why:** Dead code 提高認知負擔與維護成本。
**What:** 清理未被路由/引用的頁面、API 與常數。
**Impact:** 程式碼更精簡、搜尋更準確。

**Files:**

- Modify/Delete: `src/router/*`
- Modify/Delete: `src/views/*`
- Modify/Delete: `src/api/*`
- Modify/Delete: `src/constants/*`
- Modify/Delete: `server/src/routes/*`
- Modify/Delete: `server/src/controllers/*`
- Modify/Delete: `server/src/constants/*`

**Step 1: Write the failing test**

```text
// pseudo: 比對 router 與 views、API exports 與實際引用清單
```

**Step 2: Run test to verify it fails**
Expected: 找到未使用路由/頁面/API/常數清單

**Step 3: Write minimal implementation**

- 移除未使用檔案與引用
- 更新路由/選單/常數對應

**Step 4: Run tests to verify it passes**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src server
git commit -m "清理未使用路由與 API"
```

### Task 23: i18n key 清理與一致化

**Why:** 未使用或缺漏的 key 會造成翻譯維護困難與 UI 顯示異常。
**What:** 執行檢查腳本，補缺漏並清除未使用 key。
**Impact:** i18n 更一致，減少誤顯示風險。

**Files:**

- Modify: `scripts/check-i18n.mjs`
- Modify: `src/locales/en-US.json`
- Modify: `src/locales/zh-TW.json`
- Modify: `src/views/**`

**Step 1: Write the failing test**

```bash
node scripts/check-i18n.mjs
```

**Step 2: Run test to verify it fails**
Expected: 報出缺漏或未使用 key

**Step 3: Write minimal implementation**

- 補齊缺漏 key
- 移除未使用 key

**Step 4: Run tests to verify it passes**
Run: `node scripts/check-i18n.mjs`
Expected: 無錯誤

**Step 5: Commit**

```bash
git add scripts/check-i18n.mjs src/locales src/views
git commit -m "清理與一致化 i18n keys"
```

### Task 24: 拆分大型 Vue 頁面（可讀性）

**Why:** 單檔過大會降低可讀性與測試性。
**What:** 把大型頁面拆成子元件與 composables。
**Impact:** 更容易維護與重用。

**Files:**

- Modify: `src/views/tickets/detail/index.vue`
- Modify: `src/views/tickets/index.vue`
- Modify: `src/views/users/index.vue`
- Create: `src/components/**`
- Create: `src/composables/**`

**Step 1: Write the failing test**

```bash
wc -l src/views/tickets/detail/index.vue src/views/tickets/index.vue src/views/users/index.vue
```

**Step 2: Run test to verify it fails**
Expected: 單檔行數過高或邏輯集中

**Step 3: Write minimal implementation**

- 抽出表格/表單/狀態邏輯為元件與 composables
- 保持對外 API 不變

**Step 4: Run tests to verify it passes**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/views src/components src/composables
git commit -m "拆分大型頁面提升可讀性"
```

### Task 25: 統一 API 回應/錯誤結構

**Why:** 回應格式不一致會增加前端分支與除錯成本。
**What:** 定義一致的 success/data/error 形狀並套用。
**Impact:** 前端處理更簡單，錯誤更可追蹤。

**Files:**

- Modify: `server/src/middlewares/error.ts`
- Modify: `server/src/controllers/*`
- Create: `server/src/utils/response.ts`
- Modify: `src/api/*`

**Step 1: Write the failing test**

```text
// pseudo: expect all endpoints to return { success, data, error }
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/response-shape.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- 建立共用 response helper
- 控制器改用統一回應格式

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/response-shape.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/utils/response.ts server/src/controllers server/src/middlewares/error.ts src/api
git commit -m "統一 API 回應格式"
```

### Task 26: 統一路由/選單/權限樹來源

**Why:** basic-routes、frontendPermissionTree、後端 permissionTree 三份來源易漂移。
**What:** 決定單一來源（前端 routes 或後端 permissionTree），其餘改為衍生/移除。
**Impact:** 權限/選單一致，維護成本下降。
**Decision (建議):** 以 `basic-routes` 為單一來源（roles/icon/titleKey 在 meta），選單/權限樹由 routes 衍生；後端 permission tree 視 Task 10 移除。

**Files:**

- Modify/Delete: `src/router/basic-routes.js`
- Modify/Delete: `src/router/permission-tree.js`
- Modify: `src/store/modules/permission.js`
- (Optional) Modify/Delete: `server/src/models/permission.ts`
- (Optional) Modify/Delete: `server/src/routes/permission.ts`
- (Optional) Modify/Delete: `server/src/controllers/permission.ts`

**Step 1: Write the failing test**

```text
// pseudo: menu code 與 route name 差異需被檢出
```

**Step 2: Run test to verify it fails**
Expected: menu/routes 存在差異

**Step 3: Write minimal implementation**

- routes 作為唯一來源（meta 記錄權限/選單欄位）
- menu/permission 由 routes 衍生，不手動維護
- 移除 `src/router/permission-tree.js` 或改為由 routes 自動生成

**Step 4: Run tests to verify it passes**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src server
git commit -m "統一路由/選單/權限樹來源"
```

### Task 27: 修正 i18n 亂碼與編碼一致性

**Why:** 亂碼會造成 UI 不可讀與翻譯維護困難。
**What:** 統一為 UTF-8、補正 zh-TW 文案與 locale alias，路由/選單僅使用 i18n key。
**Impact:** 介面可讀、翻譯可維護。

**Files:**

- Modify: `src/locales/zh-TW.json`
- Modify: `src/locales/en-US.json`
- Modify: `src/locales/index.js`
- Modify: `src/router/basic-routes.js`
- Modify: `src/router/permission-tree.js`
- (Optional) Modify: `server/src/models/permission.ts`

**Step 1: Write the failing test**

```text
// pseudo: 文案不可為亂碼，所有 menu title 需有對應 i18n key
```

**Step 2: Run test to verify it fails**
Expected: 檔案包含亂碼或缺 key

**Step 3: Write minimal implementation**

- 修正亂碼字串並統一 UTF-8
- 補上 `messages['zh']` alias（或調整檢查腳本符合 `zh-TW`）
- 移除硬編碼 name/title（以 i18n key 為主）

**Step 4: Run tests to verify it passes**
Run: `node scripts/check-i18n.mjs`
Expected: 無缺漏

**Step 5: Commit**

```bash
git add src/locales src/router server/src/models/permission.ts
git commit -m "修正 i18n 亂碼並統一編碼"
```

### Task 28: 集中角色權限檢查（後端）

**Why:** ensureAdmin/ensureKycRole 重複分散，規則變動易漏改。
**What:** 提供共用 guard/middleware，路由層統一套用並集中角色規則。
**Impact:** 權限規則集中、降低維護成本。

**Files:**

- Create: `server/src/middlewares/authorize.ts`
- Modify: `server/src/routes/*.ts`
- Modify/Delete: `server/src/controllers/*.ts`（移除重複檢查）

**Step 1: Write the failing test**

```text
// pseudo: 非 ADMIN 存取管理路由應統一回 403
```

**Step 2: Run test to verify it fails**
Run: `bun test server/tests/authz.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

- 建立 `authorize({ roles })` 或 `requireAdmin`/`requireKycRole`
- routes 依角色掛載，移除 controllers 內重複檢查

**Step 4: Run tests to verify it passes**
Run: `bun test server/tests/authz.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add server/src/middlewares server/src/routes server/src/controllers server/tests
git commit -m "集中後端角色權限檢查"
```

### Task 29: 整理 API 模組位置與命名

**Why:** API 定義散落且重複，理解成本高。
**What:** 將 auth/login 相關 API 統一到 `src/api/auth.js`，並整理 `src/api/index.js` 作為單一入口。
**Impact:** API 層一致，易於維護。

**Files:**

- Create: `src/api/auth.js`
- Modify: `src/api/index.js`
- Delete: `src/views/login/api.js`
- Modify: `src/views/login/index.vue`

**Step 1: Write the failing test**

```bash
rg \"src/views/login/api.js|switchCurrentRole|toggleRole\" src
```

**Step 2: Run test to verify it fails**
Expected: 仍有舊 API 路徑或命名

**Step 3: Write minimal implementation**

- 新增 `src/api/auth.js` 統一 auth API
- `src/api/index.js` 統一 re-export 或統一引入方式
- 更新引用並移除舊檔

**Step 4: Run tests to verify it passes**
Run: `rg \"src/views/login/api.js|switchCurrentRole|toggleRole\" src`
Expected: 無舊引用

**Step 5: Commit**

```bash
git add src/api src/views/login
git commit -m "整理 API 模組位置與命名"
```

### Task 30: 清理未使用的 build plugin（page-pathes）

**Why:** `pluginPagePathes` 無實際使用點，增加維護與認知負擔。
**What:** 移除未使用的 plugin，或補上實際 import 並說明用途。
**Impact:** build 設定更精簡且可讀。

**Files:**

- Modify/Delete: `build/plugin-isme/page-pathes.js`
- Modify: `build/plugin-isme/index.js`
- Modify: `vite.config.js`

**Step 1: Write the failing test**

```text
// pseudo: 檢查是否有 import 'isme:page-pathes'
```

**Step 2: Run test to verify it fails**
Expected: 無任何使用點

**Step 3: Write minimal implementation**

- 若無用途：移除 plugin 與相關匯出
- 若有用途：新增使用點並補上註解

**Step 4: Run tests to verify it passes**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add build/plugin-isme vite.config.js
git commit -m "清理未使用的 build plugin"
```
