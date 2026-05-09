import { z } from "zod"
import { RAG_BASE_URL } from "./_config"

export default {
  description: `檢查公司 RAG 服務是否正常運行。

在使用 ragSearch 或 ragAsk 之前，若懷疑服務異常，可先呼叫此 tool 確認狀態。`,

  args: {
    _: z.string().optional().describe("無需填寫"),
  },

  async execute(_args: any) {
    const response = await fetch(`${RAG_BASE_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    }).catch((err: any) => {
      throw new Error(`RAG 服務無法連線：${err.message}`)
    })

    if (!response.ok) {
      return `RAG 服務異常，HTTP ${response.status}`
    }

    const data = await response.json().catch(() => ({}))
    return `RAG 服務正常：${JSON.stringify(data)}`
  },
}
