---
name: csv
description: Use this skill when the user wants to read, preview, analyze, or process CSV data files.
---

# CSV 檔案處理指引

## 快速預覽（csvReader 工具）

`csvReader` 可直接讀取本地 CSV，不需安裝任何套件：

```
csvReader(file_path="C:/Users/CHENG/data.csv")
csvReader(file_path="C:/data.csv", sample_rows=20, encoding="big5")
```

### 編碼說明

| 編碼 | 適用情境 |
|------|---------|
| `utf-8` | 預設，大多數情況 |
| `utf-8-sig` | Excel 另存新檔產生的 CSV（有 BOM） |
| `big5` | 繁體中文 Windows 系統建立的 CSV |
| `gbk` | 簡體中文 Windows 系統建立的 CSV |

---

## 深度分析（Python pandas）

csvReader 適合快速預覽。需要統計、篩選、轉換時用 pandas：

```python
import pandas as pd

# 讀取
df = pd.read_csv("data.csv", encoding="utf-8-sig")

# 基本了解
print(df.shape)        # (行數, 欄數)
print(df.info())       # 欄位型別與非空值數
print(df.describe())   # 數值統計
print(df.head(10))

# 篩選
df[df["狀態"] == "異常"]
df[df["數值"] > 100]

# 分組統計
df.groupby("IC型號")["Issue數"].sum()
df.groupby("狀態").size()

# 輸出
df.to_excel("output.xlsx", index=False)
df.to_csv("output.csv", index=False, encoding="utf-8-sig")
```
