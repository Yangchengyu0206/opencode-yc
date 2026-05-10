---
name: image-analysis
description: Use this skill when the user wants to analyze images, extract text from images (OCR), or interpret visual content such as charts, circuit diagrams, screenshots, or scanned documents.
---

# 圖片分析指引

## 工具選擇

| 需求 | 工具 |
|------|------|
| 理解圖片語意（這是什麼？流程是什麼？） | `imageAnalyze` |
| 萃取圖片中的文字（OCR） | `ocrImage` |

兩個工具都使用 Himax 內部的 **Qwen3-VL-32B-Instruct** 視覺模型，需要 HIMAX_TOKEN。

---

## 支援圖片格式

`.jpg` `.jpeg` `.png` `.gif` `.webp` `.bmp`

---

## 使用範例

```
# 分析電路圖語意
imageAnalyze(
  file_path="C:/circuit.png",
  prompt="請描述這個電路圖的功能與信號流向"
)

# 理解架構圖
imageAnalyze(
  file_path="C:/architecture.png",
  prompt="請說明這個系統架構圖，列出各元件與它們的關係"
)

# OCR 萃取表格文字
ocrImage(file_path="C:/register_table.png", language="zh+en")

# OCR 截圖中的錯誤訊息
ocrImage(file_path="C:/error_screenshot.png", language="en")
```

---

## 注意事項

- 圖片建議不超過 10MB（太大會增加 API 處理時間）
- 掃描版 PDF 請先轉圖片再用 `ocrImage`（可用 `pdf2image` Python 套件）
- 若遇到 SSL 錯誤，請設定環境變數 `NODE_TLS_REJECT_UNAUTHORIZED=0`
