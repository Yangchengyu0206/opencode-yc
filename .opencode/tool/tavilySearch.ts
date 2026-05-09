import { z } from "zod"
import { MS_CONFIG_PATH, loadMsConfig } from "./_config"

const TAVILY_URL = "https://api.tavily.com/search"

function getApiKey(): string | null {
  return loadMsConfig()?.tavily_api_key ?? null
}

export default {
  description: `使用 Tavily 搜尋引擎查詢網路上的公開資訊。

與 ragSearch 的差異：
- ragSearch：搜尋公司內部知識庫（IC Datasheet、工程 Issue）
- tavilySearch：搜尋網際網路（外部規格書、技術文章、新聞、Stack Overflow）

適用情境：
- 查詢公司資料庫沒有收錄的 IC 規格或競品資訊
- 搜尋技術問題的解法（Python 錯誤、library 用法）
- 查詢產業新聞、最新技術動態
- 找特定標準、協定的公開文件（MIPI、USB、HDMI）

設定方式：在 ~/.config/opencode/ms_config.json 加入 "tavily_api_key": "tvly-..."
取得 API Key：https://app.tavily.com`,

  args: {
    query: z.string().describe("搜尋關鍵字，支援中文與英文"),
    search_depth: z.enum(["basic", "advanced"]).optional().default("basic").describe(
      "搜尋深度：basic（快速，適合一般查詢）；advanced（較慢但更深入，消耗較多額度）"
    ),
    topic: z.enum(["general", "news"]).optional().default("general").describe(
      "搜尋類型：general（一般網頁）；news（最新新聞）"
    ),
    max_results: z.number().optional().default(5).describe("回傳結果數量（預設 5，上限 10）"),
    include_answer: z.boolean().optional().default(true).describe(
      "是否包含 Tavily 生成的摘要答案（預設是）"
    ),
  },

  async execute(args: any) {
    const apiKey = getApiKey()
    if (!apiKey) {
      return `[Tavily 尚未設定] 請在 ${MS_CONFIG_PATH} 加入 "tavily_api_key": "tvly-..." 後再使用。\n取得 API Key：https://app.tavily.com`
    }

    const body = {
      api_key: apiKey,
      query: args.query,
      search_depth: args.search_depth ?? "basic",
      topic: args.topic ?? "general",
      max_results: Math.min(args.max_results ?? 5, 10),
      include_answer: args.include_answer ?? true,
      include_raw_content: false,
    }

    const response = await fetch(TAVILY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    }).catch((err: any) => {
      throw new Error(`Tavily 連線失敗：${err.message}`)
    })

    if (response.status === 401) throw new Error("Tavily API Key 無效，請確認 ms_config.json 的 tavily_api_key")
    if (response.status === 429) throw new Error("Tavily 額度用盡，請到 https://app.tavily.com 確認用量")
    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText)
      throw new Error(`Tavily 搜尋失敗 (${response.status}): ${err}`)
    }

    const data = await response.json()
    const results: any[] = data.results ?? []

    if (results.length === 0) return `找不到「${args.query}」的相關結果，請嘗試換個關鍵字。`

    const lines: string[] = [`## 網路搜尋結果：「${args.query}」\n`]

    if (data.answer) {
      lines.push(`### 摘要答案`)
      lines.push(data.answer)
      lines.push("")
    }

    lines.push(`### 來源（共 ${results.length} 筆）`)
    for (const r of results) {
      const score = typeof r.score === "number" ? ` （相關度：${(r.score * 100).toFixed(0)}%）` : ""
      lines.push(`**[${r.title}](${r.url})**${score}`)
      if (r.content) {
        const preview = r.content.length > 300 ? r.content.slice(0, 300) + "…" : r.content
        lines.push(preview)
      }
      lines.push("")
    }

    return lines.join("\n")
  },
}
