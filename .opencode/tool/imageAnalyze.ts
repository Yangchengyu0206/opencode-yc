import { z } from "zod"
import { readFileSync, existsSync } from "fs"
import { extname } from "path"
import { HIMAX_API_BASE, himaxHeaders } from "./_config"

const MIME_MAP: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
}

export default {
  description: `使用 Qwen3-VL 視覺模型分析圖片語意，適合電路圖、流程圖、截圖、UI 畫面等。

與 ocrImage 的差異：
- imageAnalyze：理解圖片語意（「這是什麼」「流程是什麼」）
- ocrImage：單純萃取圖片中的文字

適用情境：
- 分析 IC Datasheet 的時序圖、方塊圖、電路圖
- 理解架構圖或流程圖
- 解讀工程截圖或 UI 畫面
- 描述圖片內容供後續處理

支援格式：.jpg .jpeg .png .gif .webp .bmp`,

  args: {
    file_path: z.string().describe("圖片檔案完整路徑"),
    prompt: z.string().optional().default("請詳細描述這張圖片的內容。如果有文字、數字或技術細節，請完整列出。").describe(
      "分析指令（可自訂，如「請說明這個電路圖的信號流向」）"
    ),
  },

  async execute(args: any) {
    if (!existsSync(args.file_path)) throw new Error(`找不到圖片：${args.file_path}`)

    const ext = extname(args.file_path).toLowerCase()
    const mime = MIME_MAP[ext]
    if (!mime) {
      throw new Error(`不支援的圖片格式：${ext}。支援：${Object.keys(MIME_MAP).join("、")}`)
    }

    if (!process.env.HIMAX_TOKEN) {
      return "[HIMAX_TOKEN 未設定] 請確認環境變數 HIMAX_TOKEN 已設定，或重新執行 install.bat。"
    }

    const imageBytes = readFileSync(args.file_path)
    const base64 = imageBytes.toString("base64")
    const dataUri = `data:${mime};base64,${base64}`
    const prompt = args.prompt ?? "請詳細描述這張圖片的內容。如果有文字、數字或技術細節，請完整列出。"

    const response = await fetch(`${HIMAX_API_BASE}/chat/completions`, {
      method: "POST",
      headers: himaxHeaders(),
      body: JSON.stringify({
        model: "Qwen/Qwen3-VL-32B-Instruct",
        messages: [{
          role: "user",
          content: [
            { type: "image_url", image_url: { url: dataUri } },
            { type: "text", text: prompt },
          ],
        }],
        max_tokens: 2048,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(60000),
    }).catch((err: any) => {
      throw new Error(`Himax API 連線失敗：${err.message}（若為 SSL 錯誤，請設定 NODE_TLS_REJECT_UNAUTHORIZED=0）`)
    })

    if (response.status === 401) throw new Error("HIMAX_TOKEN 無效，請確認環境變數或重新執行 install.bat")
    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText)
      throw new Error(`圖片分析失敗 (${response.status}): ${err}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ""
    const fileName = args.file_path.split(/[\\/]/).pop() ?? args.file_path
    return `## 圖片分析：${fileName}\n\n${content}`
  },
}
