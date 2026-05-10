import { z } from "zod"
import { readFileSync, existsSync } from "fs"

export default {
  description: `讀取本地 CSV 檔案，回傳欄位結構、資料統計與樣本行。

不需要安裝任何額外套件。
適用情境：
- 快速了解 CSV 的欄位與資料內容
- 統計行數、欄數
- 提供資料樣本給 AI 分析（之後可搭配 Python pandas 做深度處理）`,

  args: {
    file_path: z.string().describe("CSV 檔案的完整路徑"),
    sample_rows: z.number().optional().default(10).describe("顯示的樣本行數（預設 10）"),
    encoding: z.enum(["utf-8", "utf-8-sig", "big5", "gbk"]).optional().default("utf-8").describe(
      "檔案編碼：utf-8（預設）、utf-8-sig（Excel 存的 UTF-8 BOM）、big5（繁體中文 Windows）、gbk（簡體中文）"
    ),
  },

  async execute(args: any) {
    if (!existsSync(args.file_path)) {
      throw new Error(`找不到檔案：${args.file_path}`)
    }

    let raw: string
    try {
      raw = readFileSync(args.file_path, { encoding: (args.encoding ?? "utf-8") as BufferEncoding })
    } catch (err: any) {
      throw new Error(`讀取檔案失敗：${err.message}`)
    }

    // Remove UTF-8 BOM if present
    if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1)

    const lines = raw.split(/\r?\n/).filter(line => line.trim())
    if (lines.length === 0) return `CSV 檔案是空的：${args.file_path}`

    const parseRow = (line: string): string[] => {
      const result: string[] = []
      let current = ""
      let inQuote = false
      for (let i = 0; i < line.length; i++) {
        const ch = line[i]
        if (ch === '"') {
          if (inQuote && line[i + 1] === '"') { current += '"'; i++ }
          else inQuote = !inQuote
        } else if (ch === "," && !inQuote) {
          result.push(current.trim())
          current = ""
        } else {
          current += ch
        }
      }
      result.push(current.trim())
      return result
    }

    const headers = parseRow(lines[0])
    const dataLines = lines.slice(1)
    const sampleCount = Math.min(args.sample_rows ?? 10, dataLines.length)
    const sampleRows = dataLines.slice(0, sampleCount).map(parseRow)

    // Basic column stats: detect non-empty count per column
    const colStats = headers.map((h, i) => {
      const nonEmpty = dataLines.filter(l => {
        const row = parseRow(l)
        return row[i] && row[i].trim() !== ""
      }).length
      return { name: h, filled: nonEmpty }
    })

    const fileName = args.file_path.split(/[\\/]/).pop() ?? args.file_path

    const output: string[] = [
      `## CSV 分析：${fileName}`,
      "",
      `**總資料行數**：${dataLines.length}　**欄位數**：${headers.length}`,
      "",
      `### 欄位統計`,
      "| # | 欄位名稱 | 非空值數 | 空值率 |",
      "| --- | --- | --- | --- |",
      ...colStats.map((c, i) => {
        const emptyRate = dataLines.length > 0
          ? ((1 - c.filled / dataLines.length) * 100).toFixed(1) + "%"
          : "N/A"
        return `| ${i + 1} | \`${c.name}\` | ${c.filled} | ${emptyRate} |`
      }),
      "",
      `### 前 ${sampleCount} 行樣本`,
      "| " + headers.join(" | ") + " |",
      "| " + headers.map(() => "---").join(" | ") + " |",
      ...sampleRows.map(row => {
        // Pad row to header length
        while (row.length < headers.length) row.push("")
        return "| " + row.map(c => c.replace(/\|/g, "\\|")).join(" | ") + " |"
      }),
    ]

    return output.join("\n")
  },
}
