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
  description: `讀取 Outlook 收件匣的最新郵件（Microsoft Graph API）。

需要在 ms_config.json 設定 graph_access_token。
適用情境：
- 查看最新未讀郵件
- 搜尋特定主旨或寄件人的郵件
- 快速摘要近期信件`,

  args: {
    count: z.number().optional().default(10).describe("讀取筆數（預設 10，上限 50）"),
    unread_only: z.boolean().optional().default(false).describe("只顯示未讀郵件（預設否）"),
    search: z.string().optional().describe("搜尋關鍵字（主旨或寄件人名稱，選填）"),
    folder: z.enum(["inbox", "sentitems", "drafts"]).optional().default("inbox").describe("資料夾（預設收件匣）"),
  },

  async execute(args: any) {
    const config = loadConfig()
    if (!config?.graph_access_token) {
      return `[Outlook 尚未設定] 請在 ${CONFIG_PATH} 填入 graph_access_token 後再使用。`
    }
    const headers = authHeaders(config)

    const top = Math.min(args.count ?? 10, 50)
    const folder = args.folder ?? "inbox"

    let url = `${GRAPH_BASE}/me/mailFolders/${folder}/messages?$top=${top}&$orderby=receivedDateTime desc`
    url += `&$select=subject,from,receivedDateTime,isRead,bodyPreview`

    if (args.unread_only) url += `&$filter=isRead eq false`
    if (args.search) url += `&$search="${encodeURIComponent(args.search)}"`

    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
      .catch((err: any) => { throw new Error(`Graph API 連線失敗：${err.message}`) })

    if (response.status === 401) throw new Error("token 已過期，請更新 graph_access_token")
    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText)
      throw new Error(`Graph API 錯誤 (${response.status}): ${err}`)
    }

    const data = await response.json()
    const mails: any[] = data.value ?? []

    if (mails.length === 0) return `收件匣沒有符合條件的郵件`

    const folderLabel: Record<string, string> = {
      inbox: "收件匣", sentitems: "寄件備份", drafts: "草稿"
    }
    const lines: string[] = [`## Outlook ${folderLabel[folder] ?? folder}（${mails.length} 封）\n`]

    for (const mail of mails) {
      const sender = mail.from?.emailAddress?.name ?? mail.from?.emailAddress?.address ?? "未知"
      const time = mail.receivedDateTime?.slice(0, 16).replace("T", " ") ?? ""
      const unread = mail.isRead === false ? "【未讀】" : ""
      const preview = (mail.bodyPreview ?? "").slice(0, 150)
      lines.push(`${unread}**${mail.subject ?? "（無主旨）"}**`)
      lines.push(`寄件人：${sender}　時間：${time}`)
      lines.push(preview)
      lines.push("")
    }

    return lines.join("\n")
  },
}
