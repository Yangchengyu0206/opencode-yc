---
name: rag
description: 查詢公司內部知識庫（IC Datasheet、工程 Issue、客訴紀錄）
---

# 公司知識庫查詢

公司 RAG 系統包含兩個知識領域：
- **datasheet**：IC 規格書、技術文件
- **issue_tracker**：工程 Issue、Bug 紀錄、客訴

## 何時用 `ragSearch`

回傳原始文件片段，由你自行閱讀整合後回答。

適合：
- 使用者要找「相關資料」或「來源文件」
- 需要同時比對規格書與 Issue
- 需要自行判斷、綜合多份文件

```
範例：「找 HX9200 MIPI 介面的相關規格」
→ ragSearch(query="HX9200 MIPI", domain="datasheet")
```

## 何時用 `ragAsk`

將問題交給公司的 LangGraph Agent，由它完整執行檢索並生成繁體中文答案。

適合：
- 使用者有明確問題，要直接得到答案
- 涉及特定 Issue 編號（走 MSSQL 精確查詢）
- 問題跨越多個來源，讓 Agent 自行決定

```
範例：「HX9200 最近有哪些 Touch timeout 客訴？」
→ ragAsk(question="HX9200 最近有哪些 Touch timeout 客訴？")

範例：「Issue 15704 的處理結果」
→ ragAsk(question="Issue 15704 的處理結果")
```

## 判斷規則

| 使用者說的 | 用哪個 |
|-----------|--------|
| 找資料、找文件、列來源 | `ragSearch` |
| 是什麼、怎麼做、有哪些問題 | `ragAsk` |
| 指定 Issue 編號 | `ragAsk` |
| 需要比對規格書和 Issue | `ragSearch` 兩次，分別指定 domain |
