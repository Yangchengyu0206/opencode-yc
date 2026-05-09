import { z } from "zod"
import { MS_CONFIG_PATH, loadMsConfig } from "./_config"

export default {
  description: `傳送訊息通知到 Microsoft Teams 頻道（透過 Incoming Webhook）。

適用情境：
- 推送工程 Issue 摘要、RAG 查詢結果到 Teams
- 傳送自動化報告或警示通知
- 不需要登入或 Azure AD 設定，只需要 Webhook URL

設定方式（一次性）：
1. 在 Teams 頻道右鍵 → 連接器 → Incoming Webhook → 設定 → 複製 URL
2. 將 URL 寫入 ~/.config/opencode/ms_config.json 的 teams_webhook_url 欄位`,

  args: {
    message: z.string().describe("訊息內容（支援 Markdown）"),
    title: z.string().optional().describe("訊息標題（選填）"),
    color: z.string().optional().default("0076D7").describe("主題色十六進位（預設藍色 0076D7，警示用紅色 FF0000）"),
  },

  async execute(args: any) {
    const config = loadMsConfig()
    if (!config || !config.teams_webhook_url) {
      return `[Teams 尚未設定] 請建立 ${MS_CONFIG_PATH} 並填入 teams_webhook_url 後再使用。`
    }

    const card: any = {
      "@type": "MessageCard",
      "@context": "http://schema.org/extensions",
      themeColor: args.color ?? "0076D7",
      summary: args.title ?? args.message.slice(0, 60),
      sections: [
        {
          activityTitle: args.title ?? "",
          activityText: args.message,
        },
      ],
    }

    const response = await fetch(config.teams_webhook_url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(card),
      signal: AbortSignal.timeout(10000),
    }).catch((err: any) => {
      throw new Error(`Teams 無法連線：${err.message}`)
    })

    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText)
      throw new Error(`Teams 發送失敗 (${response.status}): ${err}`)
    }

    return `Teams 訊息已發送${args.title ? `（標題：${args.title}）` : ""}`
  },
}
