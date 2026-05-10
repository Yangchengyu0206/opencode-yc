import { z } from "zod"
import { readFileSync, existsSync } from "fs"

export default {
  description: `萃取 PDF 檔案的文字內容（僅支援文字型 PDF）。

掃描版 PDF（圖片構成）沒有可讀文字，請改用 ocrImage 工具。

需要安裝 pdf-parse 套件（首次使用前執行一次）：
  cd %USERPROFILE%\\.config\\opencode && npm install pdf-parse

適用情境：
- 讀取 IC 規格書、技術報告的文字內容
- 快速了解 PDF 文件的大綱與內容
- 萃取 PDF 表格文字供 AI 分析`,

  args: {
    file_path: z.string().describe("PDF 檔案完整路徑"),
    max_chars: z.number().optional().default(8000).describe("最大回傳字元數（預設 8000，避免 token 過多）"),
  },

  async execute(args: any) {
    let pdfParse: any
    try {
      pdfParse = require("pdf-parse")
    } catch {
      return [
        "[pdf-parse 未安裝] 請在終端機執行以下指令後重新啟動 opencode：",
        "",
        `  cd %USERPROFILE%\\.config\\opencode && npm install pdf-parse`,
      ].join("\n")
    }

    if (!existsSync(args.file_path)) throw new Error(`找不到檔案：${args.file_path}`)

    const buffer = readFileSync(args.file_path)
    const data = await pdfParse(buffer).catch((err: any) => {
      throw new Error(`PDF 解析失敗：${err.message}\n（若為掃描版 PDF，請改用 ocrImage 工具）`)
    })

    const totalPages: number = data.numpages ?? 0
    let text: string = data.text ?? ""

    if (!text.trim()) {
      return [
        `此 PDF 沒有可讀文字（可能是掃描版）。`,
        `共 ${totalPages} 頁，請改用 ocrImage 工具進行 OCR。`,
      ].join("\n")
    }

    const maxChars = args.max_chars ?? 8000
    const truncated = text.length > maxChars
    if (truncated) text = text.slice(0, maxChars)

    const fileName = args.file_path.split(/[\\/]/).pop() ?? args.file_path

    return [
      `## PDF 萃取：${fileName}`,
      `**頁數**：${totalPages} 頁　**總字元數**：${data.text?.length ?? 0}${truncated ? `（已截斷至 ${maxChars} 字）` : ""}`,
      "",
      text.trim(),
    ].join("\n")
  },
}
