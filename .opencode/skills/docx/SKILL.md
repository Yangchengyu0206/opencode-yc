---
name: docx
description: Use this skill whenever the user wants to create, edit, read, or analyze Word (.docx) documents — generating reports, contracts, memos, extracting text/tables, or converting to PDF.
---

# Word (.docx) 文件指引

## 工具選擇

| 任務 | 工具 |
|------|------|
| 讀取 / 分析文字 | `pandoc` 或 `python-docx` |
| 建立新文件 | `python-docx`（Python）或 `docx`（Node.js） |
| 編輯現有文件 | `python-docx` 或直接操作 XML |
| 轉 PDF | LibreOffice（`soffice --headless --convert-to pdf`） |

```bash
pip install python-docx
# 選用（文字萃取）
# choco install pandoc  或  scoop install pandoc
```

---

## 讀取文件

```bash
# pandoc — 最快，支援追蹤修訂
pandoc --track-changes=all document.docx -o output.md
```

```python
from docx import Document

doc = Document("document.docx")
for para in doc.paragraphs:
    print(para.style.name, para.text)

# 讀取表格
for table in doc.tables:
    for row in table.rows:
        print([cell.text for cell in row.cells])
```

---

## 建立新文件（python-docx）

```python
from docx import Document
from docx.shared import Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# 標題
doc.add_heading("報告標題", level=1)

# 段落
p = doc.add_paragraph("內文文字")
p.alignment = WD_ALIGN_PARAGRAPH.LEFT

# 粗體、字型、字色
run = p.add_run("重點文字")
run.bold = True
run.font.size = Pt(12)
run.font.name = "微軟正黑體"
run.font.color.rgb = RGBColor(0x1F, 0x49, 0x7D)

doc.save("output.docx")
```

### 頁面設定（⚠️ 必須明確設定）
```python
from docx.shared import Inches, Cm
from docx.oxml.ns import qn
import docx.oxml

section = doc.sections[0]
# A4
section.page_width  = Cm(21)
section.page_height = Cm(29.7)
# 或 Letter（US）
# section.page_width  = Inches(8.5)
# section.page_height = Inches(11)
section.top_margin    = Cm(2.54)
section.bottom_margin = Cm(2.54)
section.left_margin   = Cm(3.18)
section.right_margin  = Cm(3.18)
```

### 清單（⚠️ 不要用 Unicode 項目符號）

```python
# ❌ 錯誤 — 手動插入 • 符號
p = doc.add_paragraph("• 項目一")

# ✅ 正確 — 使用 List Bullet 樣式
doc.add_paragraph("項目一", style="List Bullet")
doc.add_paragraph("項目二", style="List Bullet")
doc.add_paragraph("步驟一", style="List Number")
```

### 表格
```python
table = doc.add_table(rows=3, cols=3)
table.style = "Table Grid"

# 填入資料
table.cell(0, 0).text = "IC 型號"
table.cell(0, 1).text = "Issue 數"
table.cell(0, 2).text = "狀態"

# 標題列粗體
from docx.oxml.ns import qn
for cell in table.rows[0].cells:
    for run in cell.paragraphs[0].runs:
        run.bold = True
```

### 插入圖片
```python
# type 參數非常重要，必須指定
doc.add_picture("chart.png", width=Cm(12))
```

### 頁首頁尾
```python
section = doc.sections[0]
header = section.header
header.paragraphs[0].text = "公司名稱 — 內部文件"

footer = section.footer
footer.paragraphs[0].text = "第 X 頁"
```

### 分頁
```python
from docx.oxml.ns import qn
import docx.oxml

# 在段落前插入分頁符號
doc.add_page_break()
```

---

## Node.js docx 套件（進階，功能更完整）

如果需要複雜排版（目錄、腳注、書籤、多欄）：

```bash
npm install -g docx
```

```javascript
const { Document, Packer, Paragraph, TextRun } = require('docx');
const fs = require('fs');

const doc = new Document({
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838 }  // A4 DXA 單位
      }
    },
    children: [
      new Paragraph({ children: [new TextRun("Hello World")] })
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => fs.writeFileSync("output.docx", buffer));
```

### docx-js 重要規則

- **頁面大小必須明確設定**（預設 A4，US Letter = 12240 x 15840 DXA）
- **不要用 `\n`**，改用獨立的 `Paragraph` 元素
- **不要手動插入 Unicode 項目符號**，用 `LevelFormat.BULLET` 配 numbering config
- **表格需要雙重寬度**：`columnWidths` 陣列 + 每個 cell 的 `width`，兩者都要設
- **ImageRun 必須指定 `type`**（png / jpg / jpeg / gif）
- **表格底色用 `ShadingType.CLEAR`**，不要用 `SOLID`（會變全黑背景）
- **不要用表格當分隔線**，改用 Paragraph 的 `border.bottom`

---

## 轉換輸出

```bash
# 轉 PDF（需要 LibreOffice）
soffice --headless --convert-to pdf document.docx

# 轉圖片（轉 PDF 後再用 Poppler）
soffice --headless --convert-to pdf document.docx
pdftoppm -jpeg -r 150 document.pdf page
# → page-01.jpg, page-02.jpg, ...

# .doc 轉 .docx（舊格式）
soffice --headless --convert-to docx document.doc
```

---

## 中文注意事項

- 預設字型支援中文，建議明確指定 `微軟正黑體` 或 `新細明體`
- 段落間距：`p.paragraph_format.space_after = Pt(6)`
- 行高：`p.paragraph_format.line_spacing = Pt(18)`
- 引號建議用 XML 實體（docx-js 編輯 XML 時）：
  - `&#x2018;` = ' / `&#x2019;` = '（右單引號 / 撇號）
  - `&#x201C;` = " / `&#x201D;` = "

---

## 常用樣式名稱

| 樣式名稱 | 用途 |
|---------|------|
| `Normal` | 一般內文 |
| `Heading 1` ~ `Heading 9` | 標題層級 |
| `List Bullet` | 項目清單 |
| `List Number` | 編號清單 |
| `Caption` | 圖表說明 |
| `Table Grid` | 有格線的表格 |
