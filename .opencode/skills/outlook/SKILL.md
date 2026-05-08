---
name: outlook
description: 使用 Outlook 工具透過 Microsoft Graph API 寄送或讀取電子郵件。需要在 ms_config.json 設定 graph_access_token。
---

# Microsoft Outlook 使用指引

## 工具說明

| 工具 | 用途 |
|------|------|
| `outlookSend` | 寄送電子郵件（支援多收件人、副本、HTML） |
| `outlookRead` | 讀取收件匣 / 寄件備份最新郵件 |

---

## 設定檔

`~/.config/opencode/ms_config.json` 需包含：

```json
{
  "graph_access_token": "eyJ..."
}
```

Token 取得方式請參考 **teams skill** 的說明（同一個 token，申請時加上 Mail 權限）。

所需 Graph API 權限：
- `Mail.Read` — 讀取郵件
- `Mail.Send` — 寄送郵件
- `Mail.ReadWrite` — 讀取 + 標記已讀

---

## 何時用哪個工具

| 使用者說的 | 用哪個 |
|-----------|--------|
| 寄信、發 email | `outlookSend` |
| 通知某人、回報結果 | `outlookSend` |
| 看信、查收件匣 | `outlookRead` |
| 有沒有收到 XXX 的信 | `outlookRead` |
| 未讀郵件有哪些 | `outlookRead(unread_only=true)` |

---

## outlookSend 使用範例

```
寄信給 john@company.com，主旨「HX83192 Issue 週報」，內容為 RAG 查詢結果
→ outlookSend(to="john@company.com", subject="HX83192 Issue 週報", body="...")

同時副本給 manager@company.com
→ outlookSend(..., cc="manager@company.com")

寄送 HTML 格式報告
→ outlookSend(..., body="<h1>標題</h1><p>內容</p>", is_html=true)
```

## outlookRead 使用範例

```
看最新 5 封信
→ outlookRead(count=5)

只看未讀信件
→ outlookRead(unread_only=true)

搜尋寄件人或主旨含有 "HX9200" 的信
→ outlookRead(search="HX9200")

看寄件備份
→ outlookRead(folder="sentitems")
```

---

## Token 過期處理

Graph API token 預設有效期約 **1 小時**（視組織設定而異）。

過期時工具會回傳：`token 已過期，請更新 graph_access_token`

更新方式：重新執行 MSAL 取得腳本，或到 Graph Explorer 複製新 token，貼入 `ms_config.json`。

如需長期有效 token，請請 IT 建立使用 **Client Credentials Flow** 的 App Registration（Service Account 模式，無過期問題）。
