---
name: file-reading
description: Use this skill whenever the user uploads or references a file and wants its content read, extracted, or analyzed. Auto-detect the format by extension and content, then choose the right library. Supports CSV, JSON, JSONL, Excel, PDF, Word, plain text, Markdown, XML, YAML, TOML, Parquet, and images.
---

# 檔案讀取指引

## 格式判斷流程

1. 先看副檔名（最可靠）
2. 副檔名不明時，讀前幾個位元組（magic bytes）判斷
3. 選對應工具讀取，萃取內容後回覆使用者

---

## 格式對應工具速查

| 副檔名 | 格式 | 工具 |
|--------|------|------|
| `.csv` `.tsv` | 表格 | `pandas` |
| `.json` | JSON | `json`（標準庫） |
| `.jsonl` `.ndjson` | JSON Lines | 逐行讀取 + `json` |
| `.xlsx` `.xlsm` `.xls` | Excel | `pandas` + `openpyxl` |
| `.pdf` | PDF | `pdfplumber` / `pypdf` |
| `.docx` | Word | `python-docx` / `pandoc` |
| `.txt` `.md` `.log` `.ini` `.conf` | 純文字 | 內建 `open()` |
| `.xml` | XML | `xml.etree.ElementTree` |
| `.yaml` `.yml` | YAML | `pyyaml` |
| `.toml` | TOML | `tomllib`（Python 3.11+）或 `tomli` |
| `.parquet` | Parquet | `pandas` + `pyarrow` |
| `.png` `.jpg` `.jpeg` `.webp` | 圖片 | 直接傳給 vision model 閱讀 |

---

## CSV / TSV

```python
import pandas as pd

# 自動偵測分隔符
df = pd.read_csv("file.csv")                    # 逗號分隔
df = pd.read_csv("file.tsv", sep="\t")          # tab 分隔
df = pd.read_csv("file.csv", encoding="utf-8-sig")  # 處理 BOM（Excel 匯出的 CSV）

# 編碼不確定時
df = pd.read_csv("file.csv", encoding="big5")   # 繁中 Windows 常見

print(f"欄位：{list(df.columns)}")
print(f"筆數：{len(df)}")
print(df.head())
print(df.dtypes)
```

---

## JSON

```python
import json

with open("file.json", encoding="utf-8") as f:
    data = json.load(f)

# 判斷結構
if isinstance(data, list):
    print(f"陣列，共 {len(data)} 筆")
    print("第一筆：", data[0])
elif isinstance(data, dict):
    print(f"物件，key：{list(data.keys())}")
```

---

## JSON Lines（每行一個 JSON 物件）

```python
import json

records = []
with open("file.jsonl", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line:
            records.append(json.loads(line))

print(f"共 {len(records)} 筆")
print("第一筆：", records[0])
```

---

## Excel

```python
import pandas as pd

# 讀取第一個工作表
df = pd.read_excel("file.xlsx")

# 讀取所有工作表
all_sheets = pd.read_excel("file.xlsx", sheet_name=None)
for name, df in all_sheets.items():
    print(f"工作表 [{name}]：{len(df)} 筆，欄位：{list(df.columns)}")

# 指定工作表與標題列
df = pd.read_excel("file.xlsx", sheet_name="Sheet1", header=1)
```

---

## PDF

```python
# 優先用 pdfplumber（排版保留較好）
import pdfplumber

with pdfplumber.open("file.pdf") as pdf:
    print(f"共 {len(pdf.pages)} 頁")
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            print(f"--- 第 {i+1} 頁 ---")
            print(text)

        # 萃取表格
        for table in page.extract_tables():
            import pandas as pd
            df = pd.DataFrame(table[1:], columns=table[0])
            print(df)
```

---

## Word (.docx)

```python
# 方法一：python-docx
from docx import Document

doc = Document("file.docx")
for para in doc.paragraphs:
    if para.text.strip():
        print(para.text)

# 讀取表格
for table in doc.tables:
    for row in table.rows:
        print([cell.text for cell in row.cells])
```

```bash
# 方法二：pandoc（保留格式最完整）
pandoc file.docx -o output.md
```

---

## 純文字 / Markdown / Log

```python
# 自動偵測編碼
import chardet

with open("file.txt", "rb") as f:
    raw = f.read()
encoding = chardet.detect(raw)["encoding"] or "utf-8"

with open("file.txt", encoding=encoding) as f:
    content = f.read()

print(f"編碼：{encoding}，字元數：{len(content)}")
print(content[:2000])  # 先印前 2000 字元
```

---

## XML

```python
import xml.etree.ElementTree as ET

tree = ET.parse("file.xml")
root = tree.getroot()

print(f"根元素：{root.tag}")
for child in root:
    print(f"  {child.tag}: {child.attrib} = {child.text}")
```

---

## YAML

```python
import yaml  # pip install pyyaml

with open("file.yaml", encoding="utf-8") as f:
    data = yaml.safe_load(f)

print(type(data), data)
```

---

## TOML

```python
# Python 3.11+
import tomllib
with open("file.toml", "rb") as f:
    data = tomllib.load(f)

# Python < 3.11
# pip install tomli
import tomli
with open("file.toml", "rb") as f:
    data = tomli.load(f)

print(data)
```

---

## Parquet（大資料格式）

```python
import pandas as pd  # pip install pyarrow

df = pd.read_parquet("file.parquet")
print(f"欄位：{list(df.columns)}")
print(f"筆數：{len(df)}")
print(df.head())
```

---

## 圖片

圖片直接傳給 vision model 閱讀（不需要 Python 程式）：
- 直接描述圖片內容
- 若圖片含有表格或文字，萃取並整理成結構化格式
- 若需要 Python 處理圖片元數據：

```python
from PIL import Image  # pip install Pillow
img = Image.open("file.png")
print(f"尺寸：{img.size}，模式：{img.mode}，格式：{img.format}")
```

---

## 未知格式：Magic Bytes 偵測

```python
def detect_format(path):
    with open(path, "rb") as f:
        header = f.read(8)

    signatures = {
        b"PK\x03\x04": "ZIP / Office (xlsx/docx/pptx)",
        b"%PDF":        "PDF",
        b"\xff\xfe":    "UTF-16 LE 文字",
        b"\xef\xbb\xbf":"UTF-8 BOM 文字",
        b"\x89PNG":     "PNG 圖片",
        b"\xff\xd8\xff":"JPEG 圖片",
        b"PAR1":        "Parquet",
    }
    for sig, fmt in signatures.items():
        if header.startswith(sig):
            return fmt
    return "未知格式，嘗試以純文字讀取"

print(detect_format("unknown_file"))
```

---

## 讀取後的標準回報格式

讀取任何檔案後，請依序回報：

1. **格式與大小**：檔案類型、行數/筆數/頁數
2. **結構摘要**：欄位名稱、key 列表、巢狀層級
3. **前幾筆預覽**：最多 5-10 筆或前 500 字
4. **資料品質觀察**：空值、異常值、編碼問題
5. **建議後續操作**：分析、轉換、匯出等
