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
  description: `讀取 Microsoft Teams 頻道的最新訊息（Graph API）。

需要在 ms_config.json 設定 graph_access_token 與頻道資訊。
適用情境：
- 查看指定頻道的最新討論
- 搜尋關鍵字相關的訊息
- 摘要頻道近期活動`,

  args: {
    channel: z.string().describe("頻道名稱（需與 ms_config.json 的 teams 設定相符）"),
    count: z.number().optional().default(10).describe("讀取筆數（預設 10，上限 50）"),
  },

  async execute(args: any) {
    const config = loadConfig()
    if (!config?.graph_access_token) {
      return `[Teams 讀取尚未設定] 請在 ${CONFIG_PATH} 填入 graph_access_token 後再使用。`
    }
    const headers = authHeaders(config)

    // 從 config 找到對應的 team_id 和 channel_id
    const teams: any[] = config.teams ?? []
    let teamId = "", channelId = ""
    for (const team of teams) {
      const ch = (team.channels ?? []).find(
        (c: any) => c.name === args.channel
      )
      if (ch) {
        teamId = team.team_id
        channelId = ch.channel_id
        break
      }
    }
    if (!teamId || !channelId) {
      throw new Error(
        `在 ms_config.json 找不到頻道「${args.channel}」，` +
        `請確認 teams 設定中有對應的 name / team_id / channel_id`
      )
    }

    const top = Math.min(args.count ?? 10, 50)
    const url = `${GRAPH_BASE}/teams/${teamId}/channels/${channelId}/messages?$top=${top}&$orderby=createdDateTime desc`

    const response = await fetch(url, { headers, signal: AbortSignal.timeout(15000) })
      .catch((err: any) => { throw new Error(`Graph API 連線失敗：${err.message}`) })

    if (response.status === 401) throw new Error("token 已過期，請更新 ms_config.json 的 graph_access_token")
    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText)
      throw new Error(`Graph API 錯誤 (${response.status}): ${err}`)
    }

    const data = await response.json()
    const messages: any[] = data.value ?? []

    if (messages.length === 0) return `頻道「${args.channel}」沒有訊息`

    const lines: string[] = [`## Teams 頻道「${args.channel}」最新 ${messages.length} 則訊息\n`]
    for (const msg of messages) {
      const sender = msg.from?.user?.displayName ?? "未知"
      const time = msg.createdDateTime?.slice(0, 16).replace("T", " ") ?? ""
      const body = msg.body?.content?.replace(/<[^>]+>/g, "").trim() ?? ""
      const preview = body.length > 200 ? body.slice(0, 200) + "…" : body
      lines.push(`**${sender}**（${time}）`)
      lines.push(preview)
      lines.push("")
    }
    return lines.join("\n")
  },
}
