---
name: powerpoint
description: Use this skill whenever the user wants to create, edit, or analyze PowerPoint (.pptx) presentations — generating slides, reading content, auto-layout, charts, or converting to images/PDF.
---

# PowerPoint (.pptx) 簡報指引

## 套件安裝

```bash
pip install python-pptx "markitdown[pptx]" Pillow
```

---

## 讀取簡報內容

```bash
# 最快：萃取所有文字
python -m markitdown presentation.pptx
```

```python
from pptx import Presentation

prs = Presentation("presentation.pptx")
for i, slide in enumerate(prs.slides):
    print(f"--- 第 {i+1} 張投影片 ---")
    for shape in slide.shapes:
        if shape.has_text_frame:
            print(shape.text_frame.text)
```

---

## 建立新簡報（python-pptx）

```python
from pptx import Presentation
from pptx.util import Inches, Pt, Cm
from pptx.dml.color import RGBColor

prs = Presentation()

# 版面索引：0=標題頁, 1=標題+內容, 5=空白, 6=僅標題
layout = prs.slide_layouts[1]
slide = prs.slides.add_slide(layout)

slide.shapes.title.text = "HX83192 Issue 報告"
slide.placeholders[1].text = "本月共 12 筆異常"

prs.save("report.pptx")
```

### 文字框
```python
from pptx.util import Inches, Pt
txBox = slide.shapes.add_textbox(Inches(1), Inches(2), Inches(8), Inches(1))
tf = txBox.text_frame
tf.text = "自定義文字"
tf.paragraphs[0].font.size = Pt(18)
tf.paragraphs[0].font.name = "微軟正黑體"
```

### 表格
```python
from pptx.util import Inches

rows, cols = 3, 3
table = slide.shapes.add_table(rows, cols, Inches(1), Inches(2), Inches(8), Inches(3)).table
table.cell(0, 0).text = "IC 型號"
table.cell(0, 1).text = "Issue 數"
table.cell(0, 2).text = "狀態"
```

### 插入圖片
```python
slide.shapes.add_picture("chart.png", Inches(1), Inches(2), Inches(6), Inches(4))
```

### 多頁自動產生（迴圈）
```python
data = [
    {"title": "HX83192 問題摘要", "content": "Touch timeout 12 筆"},
    {"title": "HX9200 問題摘要",  "content": "MIPI 異常 8 筆"},
]
for item in data:
    slide = prs.slides.add_slide(prs.slide_layouts[1])
    slide.shapes.title.text = item["title"]
    slide.placeholders[1].text = item["content"]
```

---

## 設計規範

### 配色原則
- **一個主色佔 60-70% 視覺比重**，搭配 1-2 個輔色和一個強調色
- 標題頁 / 結尾頁用深色背景，內容頁用淺色背景（三明治結構）
- 挑選與主題相符的顏色，不要預設藍色

### 推薦色票

| 主題 | 主色 | 輔色 | 強調色 |
|------|------|------|--------|
| Midnight Executive | `#1E2761` (深藍) | `#CADCFC` (冰藍) | `#FFFFFF` |
| Coral Energy | `#F96167` (珊瑚紅) | `#F9E795` (金黃) | `#2F3C7E` (深藍) |
| Charcoal Minimal | `#36454F` (炭灰) | `#F2F2F2` (白) | `#212121` (黑) |
| Teal Trust | `#028090` (藍綠) | `#00A896` (海沫) | `#02C39A` (薄荷) |

### 字型配對

| 標題字型 | 內文字型 |
|---------|---------|
| Georgia | Calibri |
| Arial Black | Arial |
| Cambria | Calibri |

| 元素 | 大小 |
|------|------|
| 投影片標題 | 36-44pt 粗體 |
| 章節標頭 | 20-24pt 粗體 |
| 內文 | 14-16pt |
| 說明文字 | 10-12pt |

### 每張投影片必須有視覺元素
- 圖片、圖表、圖示，或有色色塊
- **不要純文字投影片**
- 版面選項：兩欄（文字左、圖右）、圖示+文字列、2x2 網格

### 避免的常見錯誤
- 不要重複同一種版面
- 內文段落和清單用左對齊，只有標題置中
- 不要在標題下加裝飾底線（AI 生成的特徵）
- 不要低對比度文字（淺色底配淺色字）
- 間距要一致（選 0.3" 或 0.5" 並全簡報統一）

---

## QA 流程（必做）

**第一次產出幾乎都有問題，要當 bug hunt，不是確認步驟。**

### 文字 QA
```bash
python -m markitdown output.pptx
# 檢查：遺漏內容、錯字、順序錯誤、殘留 placeholder 文字
```

### 轉成圖片做視覺檢查
```bash
# 需要 LibreOffice 和 Poppler
python -m markitdown output.pptx  # 先確認文字
# LibreOffice 轉 PDF → pdftoppm 轉圖片
```

### 視覺問題清單
- 元素重疊（文字穿過形狀、線條穿過文字）
- 文字溢出邊界或被截斷
- 元素間距過小（< 0.3"）或邊緣留白不足（< 0.5"）
- 相似元素未對齊
- 低對比度（淺灰色文字在奶油色背景上）
- 殘留 placeholder 內容

### 修正循環
1. 產生 → 轉圖片 → 檢查
2. 列出發現的問題
3. 修正 → 重新確認受影響的投影片
4. 重複直到全部通過

---

## 轉換輸出

```bash
# 轉 PDF（需要 LibreOffice）
soffice --headless --convert-to pdf presentation.pptx

# 轉圖片（需要 Poppler）
pdftoppm -jpeg -r 150 presentation.pdf slide
# → slide-01.jpg, slide-02.jpg, ...
```

---

## 常用版面索引

| 索引 | 用途 |
|------|------|
| 0 | 標題頁（大標 + 副標） |
| 1 | 標題 + 內容（最常用） |
| 2 | 標題 + 兩欄 |
| 5 | 完全空白 |
| 6 | 僅標題 |
