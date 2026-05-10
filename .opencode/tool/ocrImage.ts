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

const LANG_PROMPT: Record<string, string> = {
  auto: "請萃取這張圖片中所有可見的文字，完整列出，盡量保留原始排版結構（如表格、縮排）。",
  zh: "請萃取這張圖片中所有中文文字，完整列出，保留原始排版結構。",
  en: "Please extract all English text visible in this image. List it completely, preserving the original layout structure (tables, indentation).",
  "zh+en": "請萃取這張圖片中所有文字（包含中文與英文），完整列出，保留原始排版結構。",
}

export default {
  description: `使用 Qwen3-VL 視覺模型對圖片進行 OCR，萃取圖片中的所有文字。

與 imageAnalyze 的差異：
- ocrImage：專門萃取文字（「圖片裡寫了什麼」）
- imageAnalyze：理解圖片語意（「這張圖在說什麼」）

適用情境：
- IC Datasheet 的暫存器表格截圖
- 截圖中的錯誤訊息、log、終端機輸出
- 掃描文件、白板照片、手寫筆記
- 任何需要把圖片文字轉成可複製文字的情境

支援格式：.jpg .jpeg .png .gif .webp .bmp`,

  args: {
    file_path: z.string().describe("圖片檔案完整路徑"),
    language: z.enum(["auto", "zh", "en", "zh+en"]).optional().default("auto").describe(
      "語言提示：auto（自動偵測）、zh（純中文）、en（純英文）、zh+en（中英混合）"
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
    const prompt = LANG_PROMPT[args.language ?? "auto"]

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
        max_tokens: 4096,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(60000),
    }).catch((err: any) => {
      throw new Error(`Himax API 連線失敗：${err.message}（若為 SSL 錯誤，請設定 NODE_TLS_REJECT_UNAUTHORIZED=0）`)
    })

    if (response.status === 401) throw new Error("HIMAX_TOKEN 無效，請確認環境變數或重新執行 install.bat")
    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText)
      throw new Error(`OCR 失敗 (${response.status}): ${err}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content ?? ""
    const fileName = args.file_path.split(/[\\/]/).pop() ?? args.file_path
    return `## OCR 結果：${fileName}\n\n${content}`
  },
}
