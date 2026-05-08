---
name: word
description: 使用 python-docx 在本機產生 Word (.docx) 文件：報告、備忘錄、合約
---

# Word 文件產出

使用 `python-docx` 在本機執行 Python 產生 `.docx` 文件。

## 安裝

```bash
pip install python-docx
```

## 基本結構

```python
from docx import Document
from docx.shared import Pt, RGBColor, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH

doc = Document()

# 標題
doc.add_heading("報告標題", level=1)

# 段落
p = doc.add_paragraph("內文文字")
p.alignment = WD_ALIGN_PARAGRAPH.LEFT

# 粗體 / 字型
run = p.add_run("重點文字")
run.bold = True
run.font.size = Pt(12)

# 表格
table = doc.add_table(rows=2, cols=3)
table.style = "Table Grid"
table.cell(0, 0).text = "欄位一"

# 儲存
doc.save("output.docx")
```

## 中文注意事項

- 預設字型支援中文，無需額外設定
- 若要指定字型：`run.font.name = "微軟正黑體"`
- 段落間距：`p.paragraph_format.space_after = Pt(6)`

## 常用情境

| 需求 | 做法 |
|------|------|
| 分頁 | `doc.add_page_break()` |
| 插入圖片 | `doc.add_picture("img.png", width=Cm(10))` |
| 套用樣式 | `doc.add_paragraph("文字", style="List Bullet")` |
| 頁首頁尾 | `section.header.paragraphs[0].text = "公司名稱"` |

## 輸出路徑建議

- 存到使用者指定路徑，或預設存到目前工作目錄
- 檔名使用有意義的名稱，例如 `report_20260508.docx`
