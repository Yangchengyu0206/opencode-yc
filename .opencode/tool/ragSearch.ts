import { z } from "zod"

// RAG 服務位址（固定內網位址）
const RAG_BASE_URL = "http://10.240.235.72:8000"

// 直接匯出符合 ToolDefinition 格式的物件，不依賴 @opencode-ai/plugin
export default {
  description: `搜尋公司內部知識庫（RAG 系統），從向量資料庫取得相關文件片段。

適用情境：
- 查詢 IC 規格書、Datasheet、腳位定義、暫存器描述（domain: "datasheet"）
- 查詢工程 Issue、Bug 紀錄、客訴（domain: "issue_tracker"）

當使用者詢問以下問題時，務必使用此 tool：
- IC 晶片規格、Datasheet、腳位、暫存器（例如 HX83192-C）
- 工程 Issue、Bug、客訴、測試失敗紀錄
- 公司內部技術文件

回傳內容：依相關度排序的文件片段，含來源檔名與分數。
注意：此 tool 回傳原始文件片段，由 AI 自行綜合答案；若需要完整回答請改用 ragAsk。`,

  args: {
    query: z.string().describe("自然語言搜尋字串，支援中文與英文"),
    domain: z.enum(["datasheet", "issue_tracker"]).optional().describe(
      '搜尋範圍：「datasheet」查規格書與技術文件，「issue_tracker」查工程 Issue 與 Bug 紀錄。不填則全範圍搜尋。',
    ),
    top_k: z.number().optional().default(5).describe("回傳文件數量（預設 5，上限 20）"),
  },

  async execute(args: any) {
    const topK = Math.min(args.top_k ?? 5, 20)

    const response = await fetch(`${RAG_BASE_URL}/api/v1/retrieval/metadata`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: args.query,
        top_k: topK,
        pre_k: topK * 8,
        vector_domain: args.domain ?? null,
      }),
    })

    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText)
      throw new Error(`RAG 搜尋失敗 (${response.status}): ${err}`)
    }

    const data = await response.json()

    if (!data.total_results || data.total_results === 0) {
      return `找不到「${args.query}」的相關文件，請嘗試換個關鍵字或指定 domain。`
    }

    const lines: string[] = [`找到 ${data.total_results} 筆結果（查詢：「${args.query}」）：`, ""]

    for (const doc of data.documents) {
      const meta = doc.metadata || {}
      const source = doc.source || meta.file_name || meta.source || doc.id
      const page = meta.page != null ? `（第 ${meta.page} 頁）` : ""
      const score = typeof doc.score === "number" ? doc.score.toFixed(3) : "?"
      const text: string = doc.text || ""
      const preview = text.length > 600 ? text.slice(0, 600) + "…" : text

      lines.push(`## [${doc.rank}] ${source}${page}  （分數：${score}）`)
      if (preview) lines.push(preview)
      lines.push("")
    }

    return lines.join("\n")
  },
}
