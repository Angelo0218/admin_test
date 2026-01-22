# 售票 KYC 後台專案計畫（APIDOG 測試導向）

## 目標

- 建立可完整跑 APIDOG 測試案例的後台系統，強調可測流程與狀態流轉。
- 功能聚焦 KYC 審核與客服工單，不包含售票交易流程。
- 後端可獨立運作，前端提供操作頁面與權限可見性。

## 技術與架構

- 後端：Bun + Hono + Prisma + SQLite。
- 前端：既有 Vue 後台，補齊頁面與路由。
- API：`/api/v1`，統一回應 `{ code, message, data }`。
- 分層：`routes -> controllers -> models`，`schemas`（Zod）驗證，`middlewares` 處理驗證/錯誤。

## 角色與權限

- 管理員：可見/可操作全部模組（KYC、工單、用戶、審計、角色權限）。
- 審核員：只可見 KYC 相關頁面與 API，不可見工單/用戶管理。
- 客服：只可見工單相關頁面與 API，不可見 KYC/用戶管理。

## 功能範圍（保留）

1. KYC 審核流程（待審核 → 補件 → 通過/拒絕）
2. KYC 附件（僅存假資料：檔名/URL/類型）
3. KYC 申訴/復審（待處理 → 申訴通過/申訴拒絕）
4. 客服工單（分類、標籤、內部備註、狀態流轉）
5. 用戶管理（停用/啟用、重設密碼、停用原因）
6. 審計記錄（所有狀態變更與寫入動作）
7. 角色/權限管理（客服/管理員/審核員）

## 功能範圍（排除）

- 公告/通知、字典設定、風控、金流影子、售票流程
- 用戶端 API（不開發）
- 檔案上傳（附件為假資料）

## 資料模型（概要）

- User：帳號、狀態、停用原因、角色關聯
- Role / UserRole
- KycApplication：狀態、基本資料、審核結果
- KycDocument：附件假資料（檔名/URL/類型）
- KycReview：審核紀錄（審核人、結果、原因）
- KycAppeal：申訴/復審狀態、結果
- Ticket：分類、標籤、狀態、關聯用戶
- TicketMessage：客服回覆紀錄
- AuditLog：操作人、行為、目標、時間

## 狀態流程

- KYC：`PENDING -> NEED_MORE -> PASSED/REJECTED`
- 申訴/復審：`PENDING -> APPROVED/REJECTED`
- 工單：`WAITING -> IN_PROGRESS -> CLOSED`

## API 規劃（摘要）

- Auth：登入/刷新/登出/切換角色
- Role/Permission：角色清單、權限樹、角色權限更新
- User：列表/詳情、停用/啟用、重設密碼
- KYC：列表/詳情、建立、審核（通過/拒絕/補件）、附件、申訴/復審、歷史
- Ticket：列表/詳情、建立、回覆、狀態流轉
- Audit：操作記錄查詢

## 前端頁面/路由

- KYC：`/kyc/pending`、`/kyc/detail/:id`、`/kyc/appeals`
- 工單：`/tickets`、`/tickets/:id`
- 用戶：`/users`
- 角色權限：`/roles`
- 審計：`/audit`

## 測試資料與帳號

- 預設帳號：`admin/123456`、`客服/123456`、`審核/123456`
- 內建多筆資料覆蓋各種狀態，確保 APIDOG 可測成功/失敗案例

## APIDOG 測試案例建議

- CRUD：KYC/工單/用戶/角色/審計查詢
- 狀態流轉：KYC 補件/通過/拒絕、申訴通過/拒絕、工單狀態變更
- 權限控制：客服不可見 KYC；審核員不可見工單；非管理員不可管理用戶
- 錯誤案例：狀態不可轉移、權限不足、資源不存在

## 實作步驟（精簡）

1. 更新 Prisma schema + seed（角色、用戶、KYC、工單）
2. 補齊後端 routes/controllers/models/schemas
3. 更新 OpenAPI 與 APIDOG 範例
4. 前端補頁面與路由，接 API
5. 完整測試與調整錯誤流程
