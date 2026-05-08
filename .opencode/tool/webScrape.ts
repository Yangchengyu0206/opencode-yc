import { z } from "zod"
import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const CONFIG_PATH = join(homedir(), ".config", "opencode", "ms_config.json")

function getJinaKey(): string | null {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf-8")).jina_api_key ?? null
  } catch {
    return null
  }
}

export default {
  description: `擷取指定網頁的完整內容，自動轉換為乾淨的 Markdown（使用 Jina AI Reader）。

不需要 API Key 即可使用（免費版有速率限制）。
設定 jina_api_key 可提升速率上限（https://jina.ai 免費取得）。

適用情境：
- 抓取 IC 製造商官網的規格頁、產品介紹
- 讀取公開技術文件、library 文件網頁
- 搭配 tavilySearch 使用：先搜尋取得 URL，再用 webScrape 讀全文
- 爬取競品資訊、市場報告、技術部落格

與 tavilySearch 的差異：
- tavilySearch：關鍵字搜尋，回傳多筆來源摘要
- webScrape：指定 URL，回傳單頁完整內容`,

  args: {
    url: z.string().describe("要擷取的網頁完整 URL（含 https://）"),
    max_length: z.number().optional().default(8000).describe("回傳最大字元數（預設 8000，避免 token 過多）"),
  },

  async execute(args: any) {
    const jinaKey = getJinaKey()
    const headers: Record<string, string> = {
      Accept: "text/plain",
      "X-Return-Format": "markdown",
    }
    if (jinaKey) headers["Authorization"] = `Bearer ${jinaKey}`

    const response = await fetch(`https://r.jina.ai/${args.url}`, {
      headers,
      signal: AbortSignal.timeout(30000),
    }).catch((err: any) => {
      throw new Error(`webScrape 連線失敗：${err.message}`)
    })

    if (response.status === 422) return `無法擷取此 URL（可能需要登入或為動態渲染頁面）`
    if (!response.ok) throw new Error(`webScrape 失敗 (${response.status}): ${response.statusText}`)

    const content = await response.text()
    if (!content?.trim()) return `頁面內容為空：${args.url}`

    const maxLen = args.max_length ?? 8000
    const trimmed =
      content.length > maxLen
        ? content.slice(0, maxLen) + `\n\n…（已截斷，原始 ${content.length} 字元）`
        : content

    return `## 擷取來源：${args.url}\n\n${trimmed}`
  },
}
