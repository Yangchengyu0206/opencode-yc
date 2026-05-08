---
name: pdf
description: Use this skill whenever the user wants to do anything with PDF files — reading, extracting text/tables, merging, splitting, rotating, watermarking, creating new PDFs, encrypting, extracting images, or OCR on scanned PDFs.
---

# PDF 處理指引

## Python 套件

```bash
pip install pypdf pdfplumber reportlab
```

---

## pypdf — 合併、拆分、旋轉、加密

### 合併多個 PDF
```python
from pypdf import PdfWriter, PdfReader

writer = PdfWriter()
for pdf_file in ["doc1.pdf", "doc2.pdf", "doc3.pdf"]:
    reader = PdfReader(pdf_file)
    for page in reader.pages:
        writer.add_page(page)

with open("merged.pdf", "wb") as output:
    writer.write(output)
```

### 拆分 PDF（每頁一檔）
```python
reader = PdfReader("input.pdf")
for i, page in enumerate(reader.pages):
    writer = PdfWriter()
    writer.add_page(page)
    with open(f"page_{i+1}.pdf", "wb") as output:
        writer.write(output)
```

### 旋轉頁面
```python
reader = PdfReader("input.pdf")
writer = PdfWriter()
page = reader.pages[0]
page.rotate(90)  # 順時針 90 度
writer.add_page(page)
with open("rotated.pdf", "wb") as output:
    writer.write(output)
```

### 加密 / 解密
```python
# 加密
reader = PdfReader("input.pdf")
writer = PdfWriter()
for page in reader.pages:
    writer.add_page(page)
writer.encrypt("userpassword", "ownerpassword")
with open("encrypted.pdf", "wb") as output:
    writer.write(output)

# 解密（用 qpdf）
# qpdf --password=mypassword --decrypt encrypted.pdf decrypted.pdf
```

### 加浮水印
```python
from pypdf import PdfReader, PdfWriter

watermark = PdfReader("watermark.pdf").pages[0]
reader = PdfReader("document.pdf")
writer = PdfWriter()

for page in reader.pages:
    page.merge_page(watermark)
    writer.add_page(page)

with open("watermarked.pdf", "wb") as output:
    writer.write(output)
```

---

## pdfplumber — 文字與表格萃取

```python
import pdfplumber

# 萃取文字（保留排版）
with pdfplumber.open("document.pdf") as pdf:
    for page in pdf.pages:
        print(page.extract_text())

# 萃取表格
with pdfplumber.open("document.pdf") as pdf:
    for i, page in enumerate(pdf.pages):
        for table in page.extract_tables():
            for row in table:
                print(row)

# 萃取表格 → DataFrame → Excel
import pandas as pd
with pdfplumber.open("document.pdf") as pdf:
    tables = []
    for page in pdf.pages:
        for table in page.extract_tables():
            if table:
                tables.append(pd.DataFrame(table[1:], columns=table[0]))
if tables:
    pd.concat(tables, ignore_index=True).to_excel("tables.xlsx", index=False)
```

---

## reportlab — 產生新 PDF

### 基本建立
```python
from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib import colors

doc = SimpleDocTemplate("report.pdf", pagesize=A4)
styles = getSampleStyleSheet()
story = []

story.append(Paragraph("報告標題", styles["Title"]))
story.append(Spacer(1, 12))
story.append(Paragraph("內文段落", styles["Normal"]))
story.append(PageBreak())
story.append(Paragraph("第二頁", styles["Heading1"]))

doc.build(story)
```

### 中文支援
```python
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Windows 微軟正黑體
pdfmetrics.registerFont(TTFont("MicrosoftJhengHei", r"C:\Windows\Fonts\msjh.ttc"))

# 在 Paragraph style 中指定
from reportlab.lib.styles import ParagraphStyle
style = ParagraphStyle("zh", fontName="MicrosoftJhengHei", fontSize=12)
story.append(Paragraph("中文內容", style))
```

### 表格
```python
data = [["IC 型號", "Issue 數", "狀態"],
        ["HX83192", "12", "處理中"],
        ["HX9200",  "8",  "已結案"]]

table = Table(data, colWidths=[150, 80, 80])
table.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#4F81BD")),
    ("TEXTCOLOR",  (0, 0), (-1, 0), colors.white),
    ("FONTNAME",   (0, 0), (-1, -1), "MicrosoftJhengHei"),
    ("GRID",       (0, 0), (-1, -1), 0.5, colors.grey),
    ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#EEF2FF")]),
]))
story.append(table)
```

### ⚠️ 上下標注意事項

**絕對不要**在 ReportLab 中使用 Unicode 上下標字元（₀₁₂₃ ⁰¹²³），內建字型沒有這些字符，會顯示為黑色方塊。

```python
# ❌ 錯誤
Paragraph("H₂O", styles["Normal"])

# ✅ 正確：使用 XML 標籤
Paragraph("H<sub>2</sub>O", styles["Normal"])
Paragraph("x<super>2</super> + y<super>2</super>", styles["Normal"])
```

---

## OCR — 掃描版 PDF 文字萃取

```bash
pip install pytesseract pdf2image
# 也需要安裝 Tesseract OCR 與 Poppler
```

```python
import pytesseract
from pdf2image import convert_from_path

images = convert_from_path("scanned.pdf")
text = ""
for i, image in enumerate(images):
    text += f"Page {i+1}:\n"
    text += pytesseract.image_to_string(image, lang="chi_tra+eng")
    text += "\n\n"
print(text)
```

---

## 命令列工具（需另行安裝）

```bash
# 萃取文字
pdftotext -layout input.pdf output.txt

# 合併（qpdf）
qpdf --empty --pages file1.pdf file2.pdf -- merged.pdf

# 拆分（qpdf）
qpdf input.pdf --pages . 1-5 -- pages1-5.pdf

# 提取圖片（pdfimages）
pdfimages -j input.pdf output_prefix
```

---

## 工具選擇速查

| 任務 | 工具 |
|------|------|
| 合併 / 拆分 / 旋轉 | `pypdf` |
| 萃取文字（保留排版） | `pdfplumber` |
| 萃取表格 | `pdfplumber` |
| 產生新 PDF | `reportlab` |
| OCR 掃描版 | `pytesseract` + `pdf2image` |
| 加浮水印 | `pypdf` |
| 加密 / 解密 | `pypdf` / `qpdf` |
