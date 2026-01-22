# 售票 KYC 後台設計（APIDOG 測試導向）

## 目標與範圍

本專案以「可完整跑 APIDOG 測試案例」為核心，建立售票情境的 KYC 後台示範系統。後端採 Bun + Hono + Prisma + SQLite，API 統一 `/api/v1` 並回傳 `{ code, message, data }`。功能聚焦 KYC 審核、客服工單、用戶管理與審計記錄，不包含售票交易流程與用戶端 API。附件僅存假資料（檔名/URL/類型），避免實際檔案上傳。

## 角色與權限

角色分為管理員、審核員、客服。管理員可操作所有模組；審核員只可處理 KYC；客服只可處理工單。用戶管理與角色權限維護僅管理員可見，前端路由與 API 皆需依角色做可見性限制。

## 架構與資料模型

採 MVC 分層：`routes -> controllers -> models`，Zod `schemas` 負責輸入驗證，`middlewares` 處理授權與錯誤。核心資料模型包含 `User`、`Role`、`KycApplication`、`KycDocument`、`KycReview`、`KycAppeal`、`Ticket`、`TicketMessage`、`AuditLog`。KYC 流程為 `PENDING -> NEED_MORE -> PASSED/REJECTED`，申訴流程為 `PENDING -> APPROVED/REJECTED`，工單流程為 `WAITING -> IN_PROGRESS -> CLOSED`。所有關鍵狀態變更需寫入審計記錄。

## API 與頁面

API 分組：Auth、Role/Permission、User、KYC、Ticket、Audit。前端路由包含 `/kyc/pending`、`/kyc/detail/:id`、`/kyc/appeals`、`/tickets`、`/tickets/:id`、`/users`、`/roles`、`/audit`，並依角色顯示。所有模組設計成可做 CRUD 與狀態切換，便於建立 APIDOG 測試案例與失敗情境（權限不足、狀態不可轉移）。

## 測試資料與驗證

提供預設帳號 `admin/123456`、`客服/123456`、`審核/123456`，並以 seed 建立多狀態資料（KYC、申訴、工單）供測試使用。測試重點包含：流程正確性、權限限制、錯誤回傳一致性。
