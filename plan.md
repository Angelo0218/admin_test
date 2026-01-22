# KYC 精簡整合計畫（Bun + Hono + Prisma）

## 1. 目標與範圍

- 前端只保留核心框架與 KYC 頁面骨架，刪除所有 Demo/展示頁與功能。
- 後端改為 Bun.js + Hono.js（TypeScript），資料層使用 Prisma + SQLite。
- API 統一 `/api/v1` 前綴，回應格式固定 `{ code, message, data }`。

## 2. 前端精簡清單（保留/新增/調整）

- 保留：`src/layouts/**`、`src/router/**`、`src/utils/**`、`src/store/**`、`src/components/common/**`、`src/views/login/**`、`src/views/error-page/**`。
- 刪除：`src/views/base/**`、`src/views/demo/**`、`src/views/pms/**`、`src/views/profile/**`、`src/views/home/**`、`src/views/iframe/**`（若不需要外部連結）、`src/components/me/crud/**`。
- 新增：`src/views/kyc/pending/index.vue`、`src/views/kyc/detail/index.vue`、`src/views/kyc/history/index.vue`、`src/views/kyc/components/**`、`src/api/kyc.ts`、`src/types/kyc.ts`。
- 調整：`src/router/basic-routes.js` 根路由 `/` 重導 `/kyc/pending`；`src/views/login/index.vue` 移除驗證碼 UI 與流程；`src/settings.js` 只保留 KYC 權限樹。

## 3. 後端技術與檔案架構（標準 MVC）

- 技術：`bun`、`hono`、`zod`、`jsonwebtoken`、`@prisma/client`、`prisma`。
- 目標：快速開發、模組化、可測試、路由清晰。
- 分層：Routes 只處理路由註冊；Controllers 做輸入輸出整合；Models 專注資料存取與 Prisma 操作；Middlewares 處理驗證、授權、錯誤；Schemas 用 Zod 驗證。
- 檔案結構（精簡）：

```
server/
  src/
    index.ts                # Hono app 與 middlewares 組裝
    config/
      env.ts
    routes/
      auth.ts
      user.ts
      permission.ts
      kyc.ts
    controllers/
      auth.ts
      user.ts
      permission.ts
      kyc.ts
    models/
      auth.ts
      user.ts
      permission.ts
      kyc.ts
    middlewares/
      error.ts
      auth.ts
      validate.ts
    schemas/
      auth.ts
      user.ts
      permission.ts
      kyc.ts
    db/
      client.ts
  prisma/
    schema.prisma
```

## 4. API 範圍（精簡）

- Auth：`POST /auth/login`、`POST /auth/refresh/token`、`POST /auth/logout`、`POST /auth/role/toggle`。
- User/Permission：`GET /user/detail`、`GET /role/permissions/tree`、`POST /permission/menu/validate`。
- KYC：`GET /kyc/applications`、`GET /kyc/applications/{id}`、`POST /kyc/applications/{id}/audit`、`POST /kyc/applications/{id}/assign`、`POST /kyc/applications/{id}/reset`、`GET /kyc/applications/history`、`GET /kyc/auditors`。

## 5. 精簡實作里程碑

- Phase 1：Bun + Hono 專案初始化、`index.ts`、全域錯誤處理與驗證中介層。
- Phase 2：Auth + Permission 最小可用（登入、權限樹回傳、JWT 驗證）。
- Phase 3：KYC 核心 API（列表、詳情、審核、分配、重置、歷史）。
- Phase 4：前端 KYC 頁面骨架與 API 串接（列表/詳情/歷史）。

## 6. 驗證與測試（精簡）

- 用 Zod 驗證所有 body/query/params。
- 以最小測試覆蓋關鍵路由與 JWT middleware 行為。
