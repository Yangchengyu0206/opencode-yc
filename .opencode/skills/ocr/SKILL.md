---
name: ocr
description: 使用 OCR（光學字元辨識）從圖片、掃描 PDF 中萃取文字。支援繁中、簡中、英文，適合 IC Datasheet 圖片、掃描文件、截圖中的文字萃取。
---

# OCR 文字萃取指引

## 套件安裝

```bash
# 主要套件
pip install easyocr          # 推薦，支援繁中，不需額外安裝 Tesseract
pip install pytesseract      # 傳統 OCR，需另裝 Tesseract 執行檔
pip install pdf2image Pillow # PDF 轉圖片
```

---

## EasyOCR（推薦）

**優點**：安裝簡單、繁中辨識效果好、不需安裝外部程式

```python
import easyocr

# 初始化（第一次會下載模型，約 500MB）
reader = easyocr.Reader(["ch_tra", "en"])  # 繁中 + 英文

# 從圖片萃取文字
results = reader.readtext("image.png")

# 輸出文字
for (bbox, text, confidence) in results:
    if confidence > 0.5:  # 過濾低信心度結果
        print(f"{text}  (信心度: {confidence:.2f})")

# 只要文字字串
text_only = " ".join([text for (_, text, conf) in results if conf > 0.5])
print(text_only)
```

### 語言代碼

| 語言 | 代碼 |
|------|------|
| 繁體中文 | `ch_tra` |
| 簡體中文 | `ch_sim` |
| 英文 | `en` |
| 日文 | `ja` |

```python
# 多語言同時辨識
reader = easyocr.Reader(["ch_tra", "ch_sim", "en"])
```

---

## Tesseract OCR

**需要**：先安裝 Tesseract 執行檔（Windows：`choco install tesseract`）

```python
import pytesseract
from PIL import Image

# Windows 需指定執行檔位置
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# 圖片 OCR
img = Image.open("image.png")
text = pytesseract.image_to_string(img, lang="chi_tra+eng")
print(text)

# 取得文字位置（bounding box）
data = pytesseract.image_to_data(img, output_type=pytesseract.Output.DICT)
```

---

## 掃描 PDF 的文字萃取

```python
from pdf2image import convert_from_path
import easyocr

# PDF → 圖片 → OCR
reader = easyocr.Reader(["ch_tra", "en"])

images = convert_from_path("scanned_datasheet.pdf", dpi=300)  # 高 DPI 辨識更準

all_text = []
for i, image in enumerate(images):
    import numpy as np
    results = reader.readtext(np.array(image))
    page_text = " ".join([t for (_, t, c) in results if c > 0.5])
    all_text.append(f"=== 第 {i+1} 頁 ===\n{page_text}")
    print(f"第 {i+1} 頁完成")

full_text = "\n\n".join(all_text)

# 儲存結果
with open("output.txt", "w", encoding="utf-8") as f:
    f.write(full_text)
```

---

## IC Datasheet 圖片處理技巧

Datasheet 圖片通常有表格、小字、灰底，需要前處理提升辨識率：

```python
from PIL import Image, ImageFilter, ImageEnhance
import numpy as np

def preprocess_for_ocr(image_path: str) -> np.ndarray:
    img = Image.open(image_path).convert("L")  # 轉灰階

    # 提升對比度
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(2.0)

    # 銳化
    img = img.filter(ImageFilter.SHARPEN)

    # 放大（提升小字辨識率）
    w, h = img.size
    img = img.resize((w * 2, h * 2), Image.LANCZOS)

    return np.array(img)

# 使用前處理
reader = easyocr.Reader(["ch_tra", "en"])
processed = preprocess_for_ocr("datasheet_page.png")
results = reader.readtext(processed)
```

---

## 萃取表格結構

OCR 後的文字可搭配 LLM 解析成結構化表格：

```python
import easyocr
import json

reader = easyocr.Reader(["ch_tra", "en"])
results = reader.readtext("register_table.png", detail=1)

# 依 Y 座標分組成行
rows = {}
for (bbox, text, conf) in results:
    if conf < 0.4:
        continue
    y = int(bbox[0][1] / 20) * 20  # 以 20px 為一行
    rows.setdefault(y, []).append((bbox[0][0], text))

# 每行依 X 座標排序
table_rows = []
for y in sorted(rows.keys()):
    row_text = [text for (x, text) in sorted(rows[y], key=lambda t: t[0])]
    table_rows.append(row_text)

print(table_rows)
# 再交給 AI 解析：「以上是從 Datasheet 圖片 OCR 的原始內容，請整理成暫存器表格」
```

---

## 工具選擇

| 情境 | 推薦工具 |
|------|---------|
| 一般截圖、圖片 | EasyOCR |
| 掃描 PDF | pdf2image + EasyOCR |
| 純英文文件 | Tesseract（速度快） |
| IC Datasheet 表格圖 | EasyOCR + 前處理 + LLM 解析 |
| 需要文字位置座標 | Tesseract `image_to_data` |
