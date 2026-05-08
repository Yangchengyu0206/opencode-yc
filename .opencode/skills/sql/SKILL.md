---
name: sql
description: 將自然語言問題轉換為 SQL 查詢，或協助撰寫、除錯 SQL。支援 MSSQL / MySQL / PostgreSQL / SQLite，特別針對 MSSQL Issue Tracker 場景。
---

# SQL 查詢指引（NL2SQL）

## 自然語言轉 SQL 的標準流程

1. **確認資料庫類型**：MSSQL / MySQL / PostgreSQL / SQLite
2. **了解表格 schema**：先問使用者或查詢資料表結構
3. **轉換為 SQL**：依語法規則產出查詢
4. **說明查詢邏輯**：讓使用者能理解並驗證

---

## MSSQL 常用語法

### 基本查詢
```sql
-- 查詢前 N 筆（MSSQL 用 TOP，不是 LIMIT）
SELECT TOP 10 * FROM Issues ORDER BY CreateDate DESC

-- 模糊搜尋（LIKE）
SELECT * FROM Issues WHERE Title LIKE '%Touch timeout%'

-- 日期範圍
SELECT * FROM Issues
WHERE CreateDate >= '2025-01-01' AND CreateDate < '2026-01-01'

-- 多條件
SELECT IssueID, Title, Status, AssignTo
FROM Issues
WHERE ChipModel = 'HX83192' AND Status = '處理中'
ORDER BY CreateDate DESC
```

### 聚合統計
```sql
-- 各 IC 型號的 Issue 數量
SELECT ChipModel, COUNT(*) AS IssueCount
FROM Issues
GROUP BY ChipModel
ORDER BY IssueCount DESC

-- 每月新增 Issue 數
SELECT
    FORMAT(CreateDate, 'yyyy-MM') AS YearMonth,
    COUNT(*) AS Count
FROM Issues
GROUP BY FORMAT(CreateDate, 'yyyy-MM')
ORDER BY YearMonth DESC

-- 各狀態比例
SELECT Status, COUNT(*) AS Cnt,
    CAST(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS DECIMAL(5,1)) AS Pct
FROM Issues
GROUP BY Status
```

### 全文搜尋
```sql
-- MSSQL 全文搜尋（需要建立全文索引）
SELECT * FROM Issues
WHERE CONTAINS(Description, '"Touch timeout" OR "touch no response"')

-- 不需全文索引的替代方案
SELECT * FROM Issues
WHERE Description LIKE '%Touch timeout%'
   OR Title LIKE '%Touch timeout%'
```

### JOIN 查詢
```sql
-- Issue + 關聯客戶資料
SELECT i.IssueID, i.Title, c.CustomerName, i.CreateDate
FROM Issues i
LEFT JOIN Customers c ON i.CustomerID = c.CustomerID
WHERE i.ChipModel = 'HX9200'
```

---

## Python 連線 MSSQL

```python
# pip install pyodbc
import pyodbc
import pandas as pd

conn_str = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=10.240.235.xx;"
    "DATABASE=IssueTracker;"
    "UID=帳號;PWD=密碼"
)

conn = pyodbc.connect(conn_str)

# 查詢回 DataFrame
df = pd.read_sql_query("""
    SELECT TOP 20 IssueID, Title, ChipModel, Status, CreateDate
    FROM Issues
    WHERE ChipModel = 'HX83192'
    ORDER BY CreateDate DESC
""", conn)

print(df)
conn.close()
```

---

## NL2SQL 轉換範例

| 使用者說的 | 對應 SQL |
|-----------|---------|
| HX83192 最近 10 筆 Issue | `SELECT TOP 10 ... WHERE ChipModel='HX83192' ORDER BY CreateDate DESC` |
| 本月新增幾個 Issue | `SELECT COUNT(*) FROM Issues WHERE MONTH(CreateDate)=MONTH(GETDATE())` |
| 還沒結案的有哪些 | `SELECT ... WHERE Status != '已結案'` |
| Issue 15704 的詳細資料 | `SELECT * FROM Issues WHERE IssueID = 15704` |
| 每個工程師負責幾個 | `SELECT AssignTo, COUNT(*) FROM Issues GROUP BY AssignTo` |

---

## 常見 MSSQL vs MySQL 語法差異

| 功能 | MSSQL | MySQL |
|------|-------|-------|
| 限制筆數 | `TOP 10` | `LIMIT 10` |
| 字串連接 | `+` 或 `CONCAT()` | `CONCAT()` |
| 取得當下時間 | `GETDATE()` | `NOW()` |
| 日期格式化 | `FORMAT(date, 'yyyy-MM-dd')` | `DATE_FORMAT(date, '%Y-%m-%d')` |
| 字串長度 | `LEN()` | `LENGTH()` |
| 判斷空值 | `ISNULL(col, 0)` | `IFNULL(col, 0)` |

---

## 查詢結果輸出

查詢完成後可以：
- 直接顯示表格
- 用 `excel` skill 匯出成 Excel
- 用 `powerpoint` skill 製作統計圖表

```python
# 查詢完直接存 Excel
df.to_excel("issue_report.xlsx", index=False)
```
