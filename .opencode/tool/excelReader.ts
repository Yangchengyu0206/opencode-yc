import { z } from "zod"
import { existsSync } from "fs"

export default {
  description: `讀取本地 Excel (.xlsx / .xls) 檔案，回傳工作表結構與資料樣本。

需要安裝 xlsx 套件（首次使用前執行一次）：
  cd %USERPROFILE%\\.config\\opencode && npm install xlsx

適用情境：
- 查看 Excel 的工作表清單與欄位結構
- 取得資料樣本供 AI 分析
- 快速了解試算表內容（之後可搭配 Python openpyxl / pandas 做進一步處理）`,

  args: {
    file_path: z.string().describe("Excel 檔案完整路徑（.xlsx 或 .xls）"),
    sheet_name: z.string().optional().describe("工作表名稱（不填則讀第一個工作表）"),
    sample_rows: z.number().optional().default(10).describe("顯示的樣本行數（預設 10）"),
  },

  async execute(args: any) {
    let XLSX: any
    try {
      XLSX = require("xlsx")
    } catch {
      return [
        "[xlsx 未安裝] 請在終端機執行以下指令後重新啟動 opencode：",
        "",
        `  cd %USERPROFILE%\\.config\\opencode && npm install xlsx`,
      ].join("\n")
    }

    if (!existsSync(args.file_path)) {
      throw new Error(`找不到檔案：${args.file_path}`)
    }

    const workbook = XLSX.readFile(args.file_path)
    const sheetNames: string[] = workbook.SheetNames

    if (sheetNames.length === 0) return "此 Excel 檔案沒有任何工作表"

    const targetSheet = args.sheet_name ?? sheetNames[0]
    if (!sheetNames.includes(targetSheet)) {
      return `找不到工作表「${targetSheet}」\n現有工作表：${sheetNames.join("、")}`
    }

    const sheet = workbook.Sheets[targetSheet]
    const data: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })
    const nonEmptyRows = data.filter((r: any[]) => r.some((c: any) => c !== ""))

    if (nonEmptyRows.length === 0) return `工作表「${targetSheet}」是空的`

    const headers = nonEmptyRows[0].map(String)
    const rows = nonEmptyRows.slice(1)
    const sampleCount = Math.min(args.sample_rows ?? 10, rows.length)
    const sampleRows = rows.slice(0, sampleCount)

    const fileName = args.file_path.split(/[\\/]/).pop() ?? args.file_path

    const lines: string[] = [
      `## Excel 分析：${fileName}`,
      "",
      `**工作表**：${sheetNames.join("、")}　（目前讀取：**${targetSheet}**）`,
      `**資料行數**：${rows.length}　**欄位數**：${headers.length}`,
      "",
      `### 欄位清單`,
      headers.map((h, i) => `${i + 1}. \`${h}\``).join("\n"),
      "",
      `### 前 ${sampleCount} 行樣本`,
      "| " + headers.join(" | ") + " |",
      "| " + headers.map(() => "---").join(" | ") + " |",
      ...sampleRows.map((row: any[]) => {
        const cells = headers.map((_, i) => String(row[i] ?? "").replace(/\|/g, "\\|"))
        return "| " + cells.join(" | ") + " |"
      }),
    ]

    return lines.join("\n")
  },
}
