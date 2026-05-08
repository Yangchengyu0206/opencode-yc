import { z } from "zod"
import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const CONFIG_PATH = join(homedir(), ".config", "opencode", "ms_config.json")
const GRAPH_BASE = "https://graph.microsoft.com/v1.0"

function loadConfig() {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8"))
  } catch {
    return null
  }
}

function authHeaders(config: any) {
  return {
    Authorization: `Bearer ${config.graph_access_token}`,
    "Content-Type": "application/json",
  }
}

export default {
  description: `透過 Outlook 寄送電子郵件（Microsoft Graph API）。

需要在 ms_config.json 設定 graph_access_token。
適用情境：
- 寄送工程報告、Issue 摘要給指定人員
- 傳送自動化通知信件
- 支援多收件人、副本、HTML 格式`,

  args: {
    to: z.string().describe("收件人 Email，多人用逗號分隔（例如 a@co.com,b@co.com）"),
    subject: z.string().describe("郵件主旨"),
    body: z.string().describe("郵件內容"),
    cc: z.string().optional().describe("副本收件人 Email，多人用逗號分隔（選填）"),
    is_html: z.boolean().optional().default(false).describe("內容是否為 HTML 格式（預設純文字）"),
  },

  async execute(args: any) {
    const config = loadConfig()
    if (!config?.graph_access_token) {
      return `[Outlook 尚未設定] 請在 ${CONFIG_PATH} 填入 graph_access_token 後再使用。`
    }
    const headers = authHeaders(config)

    const toList = args.to.split(",").map((e: string) => ({
      emailAddress: { address: e.trim() },
    }))

    const message: any = {
      subject: args.subject,
      body: {
        contentType: args.is_html ? "HTML" : "Text",
        content: args.body,
      },
      toRecipients: toList,
    }

    if (args.cc) {
      message.ccRecipients = args.cc.split(",").map((e: string) => ({
        emailAddress: { address: e.trim() },
      }))
    }

    const response = await fetch(`${GRAPH_BASE}/me/sendMail`, {
      method: "POST",
      headers,
      body: JSON.stringify({ message, saveToSentItems: true }),
      signal: AbortSignal.timeout(15000),
    }).catch((err: any) => { throw new Error(`Graph API 連線失敗：${err.message}`) })

    if (response.status === 401) throw new Error("token 已過期，請更新 graph_access_token")
    if (response.status === 202) return `郵件已發送至 ${args.to}`

    const err = await response.text().catch(() => response.statusText)
    throw new Error(`Outlook 發送失敗 (${response.status}): ${err}`)
  },
}
