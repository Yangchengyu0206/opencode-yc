---
name: teams
description: 使用 Microsoft Teams 工具傳送通知或讀取頻道訊息。teamsNotify 透過 Incoming Webhook 發送（簡單設定），teamsRead 透過 Graph API 讀取訊息（需要 token）。
---

# Microsoft Teams 使用指引

## 工具說明

| 工具 | 用途 | 需要設定 |
|------|------|---------|
| `teamsNotify` | 傳送訊息到指定頻道 | Incoming Webhook URL |
| `teamsRead` | 讀取頻道最新訊息 | Graph API Token + 頻道 ID |

---

## 設定檔位置

`~/.config/opencode/ms_config.json`

```json
{
  "teams_webhook_url": "https://xxx.webhook.office.com/webhookb2/...",
  "graph_access_token": "eyJ...",
  "teams": [
    {
      "name": "工程討論",
      "team_id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      "channels": [
        { "name": "general",     "channel_id": "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy" },
        { "name": "bug-tracker", "channel_id": "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz" }
      ]
    }
  ]
}
```

---

## Incoming Webhook 設定（teamsNotify 只需這個）

1. 開啟 Teams → 進入目標頻道
2. 頻道名稱右側 `...` → 連接器
3. 搜尋「Incoming Webhook」→ 設定
4. 輸入名稱（例如 opencode）→ 建立
5. 複製 Webhook URL → 貼入 `ms_config.json` 的 `teams_webhook_url`

---

## Graph API Token 取得（teamsRead 需要）

### 方法一：Azure Portal 手動取得（測試用，1 小時有效）

1. 前往 [https://developer.microsoft.com/graph/graph-explorer](https://developer.microsoft.com/graph/graph-explorer)
2. 登入公司帳號
3. 複製左上角的 Access Token → 貼入 `ms_config.json` 的 `graph_access_token`

### 方法二：Python 取得（需要 IT 建立 App Registration）

```python
# pip install msal
import msal, json

CLIENT_ID  = "你的 App ID"
TENANT_ID  = "你的 Tenant ID"
SCOPES     = ["https://graph.microsoft.com/ChannelMessage.Read.All",
               "https://graph.microsoft.com/Mail.ReadWrite",
               "https://graph.microsoft.com/Mail.Send"]

app = msal.PublicClientApplication(CLIENT_ID, authority=f"https://login.microsoftonline.com/{TENANT_ID}")
flow = app.initiate_device_flow(scopes=SCOPES)
print(flow["message"])  # 會顯示：前往 https://microsoft.com/devicelogin 輸入 XXXX-XXXX

result = app.acquire_token_by_device_flow(flow)
print("Access Token:", result["access_token"])
# 複製這個 token 到 ms_config.json
```

### 取得頻道 ID

```python
import requests, json

TOKEN = "your_access_token"
headers = {"Authorization": f"Bearer {TOKEN}"}

# 列出所有 Teams
teams = requests.get("https://graph.microsoft.com/v1.0/me/joinedTeams", headers=headers).json()
for t in teams["value"]:
    print(t["displayName"], "→ team_id:", t["id"])

# 列出指定 Team 的頻道
team_id = "填入上面的 team_id"
channels = requests.get(f"https://graph.microsoft.com/v1.0/teams/{team_id}/channels", headers=headers).json()
for c in channels["value"]:
    print(c["displayName"], "→ channel_id:", c["id"])
```

---

## 何時用哪個工具

| 使用者說的 | 用哪個 |
|-----------|--------|
| 傳到 Teams、通知 Teams | `teamsNotify` |
| 發一則訊息到頻道 | `teamsNotify` |
| 看 Teams 最新消息 | `teamsRead` |
| 查頻道有沒有人提到 XXX | `teamsRead` |

---

## 訊息顏色建議

| 情境 | color 值 |
|------|---------|
| 一般通知（藍） | `0076D7` |
| 成功 / 完成（綠） | `36B37E` |
| 警示 / 異常（紅） | `FF0000` |
| 警告（橘） | `FF8C00` |
