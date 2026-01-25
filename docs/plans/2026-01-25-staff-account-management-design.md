# 2026-01-25 後台員工帳號管理設計

## 目標

- 提供後台管理員建立、停用、刪除員工帳號的能力
- 支援角色（ADMIN / SUPPORT / AUDITOR）指派與檢視
- 所有關鍵操作必須有審計記錄

## 範圍

- 後台員工清單：查詢、篩選、分頁
- 新增員工、停用員工、刪除員工
- 審計紀錄：記錄建立/刪除行為

## 伺服端變更

- `GET /users` 回傳員工列表，僅允許 ADMIN/SUPPORT/AUDITOR 使用；排除 `status = DELETED`
- `POST /users` 建立員工（僅 ADMIN），payload：`username/password/displayName/roleCode`
- `POST /users/:id/delete` 刪除員工（僅 ADMIN），需驗證 `adminPassword`，並設定 `status = DELETED`、`disabledReason = 'deleted'`
- `auth.login` 若 `status = DELETED` 則拒絕登入
- 審計事件新增 `USER_CREATE`、`USER_DELETE`
- 相關 schema/model/controller 更新

## 前端變更

- 員工列表頁支援篩選與關鍵字搜尋
- 新增員工彈窗、刪除員工確認視窗
- i18n 文案新增/調整

## 測試

1. `GET /users` 只返回非 DELETED 使用者
2. `POST /users` 成功建立並寫入審計紀錄
3. `POST /users/:id/delete` 成功刪除並禁止登入

## 風險與注意事項

- 權限不足應回 403，未登入回 401
- 刪除為不可逆操作，需二次確認

## 相容性

- 保持現有 SUPPORT/AUDITOR 權限邏輯不變
- 既有帳號不受影響
