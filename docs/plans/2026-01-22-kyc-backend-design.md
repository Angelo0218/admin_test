# KYC 後端設計摘要

## 目標與範圍

本專案以 Koa v2 + TypeScript（strict）為核心，建立一套小而美但高規範的 KYC 後台 API。所有回應遵循 `{ code, message, data }`，並以 `/api/v1` 作為全域前綴，確保 API 一致性。資料層以 Prisma + SQLite 起步，便於快速落地與未來擴充。JWT 作為認證策略，角色切換與 RBAC 權限將在 auth 與 permission 模組中完成。

## 架構與模組

採用功能模組分層：Routes → Controller → Service → Repository/Prisma。Routes 負責組合 middleware（驗證、授權）；Controller 專注 HTTP I/O；Service 處理商業邏輯與狀態流轉；Repository 封裝資料存取。模組包含 auth、user、permission、kyc；共用能力放在 shared（錯誤處理、回應包裝、分頁工具）。

## 資料模型與狀態流轉

核心實體包含 User/Role/Permission 與 KycApplication、KycDocument、KycAuditRecord。KYC 狀態依 `PENDING/APPROVED/REJECTED/RESET` 流轉，審核與重置在 Service 層集中管理，並確保審核決策僅接受 `APPROVED` 或 `REJECTED`。

## 驗證、錯誤與測試

所有請求參數以 Zod 驗證，錯誤統一由 Global Error Handler 回傳標準格式。測試以 APIdog 匯入 OpenAPI 進行契約驗證，並補充 `supertest` 的核心路由測試，以確保與文件一致。
