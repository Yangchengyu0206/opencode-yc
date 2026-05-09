import { z } from "zod"
import { RAG_BASE_URL } from "./_config"

// 直接匯出符合 ToolDefinition 格式的物件，不依賴 @opencode-ai/plugin
export default {
  description: `向公司內部 RAG Agent 提問，取得完整的中文回答。

與 ragSearch 的差異：
- ragSearch：返回原始文件片段，由 opencode 的 AI 自行組成答案
- ragAsk：將問題交給 rag_work 的 LangGraph Agent，由它完整執行檢索 + 回答

rag_work Agent 的能力：
- 搜尋 IC Datasheet 向量庫（Qdrant）
- 搜尋工程 Issue 向量庫（Qdrant）
- 直接查詢 MSSQL Issue Tracker 資料庫（精確 Issue ID 查詢）
- 綜合以上來源，生成完整中文回答

適合情境：
- 需要整合多個來源的完整回答（例如「HX83192 有哪些 Touch timeout 問題？」）
- 需要查詢特定 Issue 編號的詳細資訊
- 問題已明確，不需要 opencode AI 再做額外推理`,

  args: {
    question: z.string().describe("要詢問公司知識庫的問題，支援中文與英文"),
    engine: z.enum(["agent", "agent-react"]).optional().default("agent").describe(
      '執行引擎：「agent」為確定性 LangGraph 流程（較快，建議優先使用）；「agent-react」為 ReAct 推理模式（適合需要多步推理的複雜問題）。',
    ),
  },

  async execute(args: any) {
    // 依序嘗試：agent → 基本 chat（fallback）
    const endpoints =
      args.engine === "agent-react"
        ? ["/api/v1/chat/agent-react", "/api/v1/chat/"]
        : ["/api/v1/chat/agent", "/api/v1/chat/"]

    let lastError = ""
    for (const endpoint of endpoints) {
      const response = await fetch(`${RAG_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([{ role: "user", content: args.question }]),
      })

      if (response.ok) {
        const data = await response.json()
        return data.content ?? data.message ?? JSON.stringify(data)
      }

      // 500 就換下一個端點
      lastError = `${endpoint} → ${response.status}`
    }

    throw new Error(`RAG Agent 全部端點失敗：${lastError}`)
  },
}
