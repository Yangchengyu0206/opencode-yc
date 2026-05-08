import { z } from "zod"

const ARXIV_API = "https://export.arxiv.org/api/query"

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`))
  return m ? m[1].trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ") : ""
}

function extractAllTags(xml: string, tag: string): string[] {
  return [...xml.matchAll(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "g"))].map(
    (m) => m[1].trim().replace(/<[^>]+>/g, "").replace(/\s+/g, " ")
  )
}

export default {
  description: `搜尋 ArXiv 學術論文庫（完全免費，不需 API Key）。

適用情境：
- 查詢 IC 設計、觸控技術、MIPI、嵌入式系統的最新研究論文
- 尋找特定演算法或技術方案的學術依據
- 查詢電機工程、信號處理相關研究

常用分類代碼：
- eess.SP（訊號處理）、eess.SY（系統控制）
- cs.AI（人工智慧）、cs.LG（機器學習）
- cond-mat（凝態物理，半導體相關）`,

  args: {
    query: z.string().describe("搜尋關鍵字（建議英文，例如 touch IC noise cancellation）"),
    max_results: z.number().optional().default(5).describe("回傳篇數（預設 5，上限 20）"),
    category: z
      .string()
      .optional()
      .describe("ArXiv 分類代碼（選填，例如 eess.SP）。不填則全類別搜尋"),
  },

  async execute(args: any) {
    const max = Math.min(args.max_results ?? 5, 20)
    const q = args.category
      ? `cat:${args.category} AND all:${args.query}`
      : `all:${args.query}`

    const url =
      `${ARXIV_API}?search_query=${encodeURIComponent(q)}` +
      `&start=0&max_results=${max}&sortBy=relevance&sortOrder=descending`

    const response = await fetch(url, { signal: AbortSignal.timeout(20000) }).catch(
      (err: any) => { throw new Error(`ArXiv 連線失敗：${err.message}`) }
    )

    if (!response.ok) throw new Error(`ArXiv API 錯誤 (${response.status})`)

    const xml = await response.text()
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map((m) => m[1])

    if (entries.length === 0)
      return `找不到「${args.query}」的相關論文，請嘗試其他關鍵字或移除 category 限制。`

    const lines: string[] = [
      `## ArXiv 論文搜尋：「${args.query}」（共 ${entries.length} 篇）\n`,
    ]

    for (const entry of entries) {
      const title = extractTag(entry, "title")
      const summary = extractTag(entry, "summary")
      const published = extractTag(entry, "published").slice(0, 10)
      const idUrl = extractTag(entry, "id")
      const authors = extractAllTags(entry, "name").slice(0, 3).join(", ")
      const preview = summary.length > 250 ? summary.slice(0, 250) + "…" : summary

      lines.push(`### ${title}`)
      lines.push(`作者：${authors}　　發表：${published}`)
      lines.push(`連結：${idUrl}`)
      lines.push(preview)
      lines.push("")
    }

    return lines.join("\n")
  },
}
