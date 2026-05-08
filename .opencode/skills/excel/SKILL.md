---
name: excel
description: Use this skill any time a spreadsheet file is the primary input or output — opening, reading, editing, or creating .xlsx/.csv files, adding formulas/formatting/charts, cleaning messy data, or converting tabular formats.
---

# Excel (.xlsx) 試算表指引

## 套件安裝

```bash
pip install openpyxl pandas
```

---

## ⚠️ 最重要原則：用 Excel 公式，不要 hardcode 計算結果

計算值必須寫成 Excel 公式，讓試算表保持可更新性。

```python
# ❌ 錯誤 — 用 Python 算完再填入
total = df["Sales"].sum()
sheet["B10"] = total          # hardcode 了 5000，資料改了不會自動更新

# ✅ 正確 — 填入 Excel 公式
sheet["B10"] = "=SUM(B2:B9)"  # Excel 自己算，永遠正確
sheet["C5"] = "=(C4-C2)/C2"  # 成長率
sheet["D20"] = "=AVERAGE(D2:D19)"
```

這個規則適用於**所有計算**：加總、百分比、比率、差值、平均值等。

---

## 建立新的 Excel 檔案（openpyxl）

```python
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = Workbook()
ws = wb.active
ws.title = "工作表一"

# 填入資料
ws["A1"] = "IC 型號"
ws["B1"] = "Issue 數"
ws.append(["HX83192", 12])
ws.append(["HX9200",  8])

# 標題列樣式
header_fill = PatternFill("solid", fgColor="4F81BD")
for cell in ws[1]:
    cell.font = Font(bold=True, color="FFFFFF")
    cell.fill = header_fill
    cell.alignment = Alignment(horizontal="center")

# 欄寬
ws.column_dimensions["A"].width = 20

# Excel 公式
ws["C2"] = "=SUM(B2:B3)"

# 儲存
wb.save("output.xlsx")
```

---

## 讀取與編輯現有 Excel（openpyxl）

```python
from openpyxl import load_workbook

# 讀取（保留公式）
wb = load_workbook("existing.xlsx")
ws = wb.active  # 或 wb["SheetName"]

# 讀取計算後的值（注意：儲存時公式會變成值，永久消失）
wb_data = load_workbook("existing.xlsx", data_only=True)

# 修改
ws["A1"] = "新值"
ws.insert_rows(2)   # 在第 2 列插入
ws.delete_cols(3)   # 刪除第 3 欄

# 新增工作表
ws2 = wb.create_sheet("Sheet2")

wb.save("modified.xlsx")
```

---

## 資料分析（pandas）

```python
import pandas as pd

# 讀取
df = pd.read_excel("file.xlsx")                     # 第一個工作表
all_sheets = pd.read_excel("file.xlsx", sheet_name=None)  # 所有工作表

# 分析
df.head()
df.info()
df.describe()

# 篩選、轉換後輸出
df_filtered = df[df["狀態"] == "處理中"]
df_filtered.to_excel("output.xlsx", index=False)
```

---

## 公式錯誤防範清單

openpyxl 填入公式後，值不會自動計算（公式只是字串）。需要用 LibreOffice 重算，或用 Excel 開啟。

| 公式錯誤 | 常見原因 |
|---------|---------|
| `#REF!` | 儲存格參照錯誤（刪除了被參照的欄列） |
| `#DIV/0!` | 分母為零 |
| `#VALUE!` | 資料型別錯誤 |
| `#N/A` | VLOOKUP 找不到對應值 |
| `#NAME?` | 函數名稱打錯 |

防範方法：
```python
# 確認參照正確（Excel 是 1-indexed，DataFrame row 5 = Excel row 6）
# 確認欄號對應（欄 64 = BL，不是 BK）
# 分母加保護
sheet["C2"] = "=IF(B2=0,0,A2/B2)"
```

---

## 財務模型色彩標準

| 顏色 | 用途 |
|------|------|
| 藍色 RGB(0,0,255) | 硬編輸入值（使用者會修改的數字） |
| 黑色 RGB(0,0,0) | 所有公式與計算 |
| 綠色 RGB(0,128,0) | 同一活頁簿內其他工作表的連結 |
| 紅色 RGB(255,0,0) | 外部檔案的連結 |
| 黃色底 RGB(255,255,0) | 需要注意的關鍵假設欄位 |

---

## 圖表

```python
from openpyxl.chart import BarChart, Reference

chart = BarChart()
data = Reference(ws, min_col=2, min_row=1, max_row=ws.max_row)
chart.add_data(data, titles_from_data=True)
chart.title = "Issue 數量統計"
ws.add_chart(chart, "E2")
```

---

## 常用操作速查

| 需求 | 做法 |
|------|------|
| 合併儲存格 | `ws.merge_cells("A1:C1")` |
| 數字格式 | `cell.number_format = "#,##0"` |
| 日期格式 | `cell.number_format = "YYYY-MM-DD"` |
| 百分比格式 | `cell.number_format = "0.0%"` |
| 負數括號格式 | `cell.number_format = "$#,##0;($#,##0);-"` |
| 凍結首列 | `ws.freeze_panes = "A2"` |
| 跨工作表公式 | `ws["A1"] = "=Sheet1!B5"` |

---

## 工具選擇原則

- **pandas**：大量資料分析、轉換、簡單匯出
- **openpyxl**：需要公式、格式、圖表、複雜樣式
