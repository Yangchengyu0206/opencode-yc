---
name: buglist
description: 查詢 BugList 紀錄（bug 編號、Title、RootCause、Resolution、RD/SE Report 等）
---

# BugList 查詢

公司的 BugList 系統把每筆 bug 拆成多個欄位向量化：

- **Title**：純文字標題
- **Description**：bug 描述
- **RootCause**：根因分析
- **Conclusion / Resolution / Workaround**：結論、處理結果、暫解
- **RDReport / SEReport**：RD / SE 工程報告（V1 舊版）
- **NotifyToCustomerMessage**：給客戶的通知

這些都在向量資料庫的 `bug_list` collection。

## 何時用 buglist 查詢

當使用者問題明顯關於 **bug 紀錄本身的內容**：

| 使用者說的 | 動作 |
|-----------|------|
| 「Bug 12345 是什麼問題」「Ticket XXXX 的處理」 | `ragSearch(query="...", domain="bug_list")` |
| 「跟 timeout 有關的 bug」「最近 reset 失敗的紀錄」 | `ragSearch(query="...", domain="bug_list")` |
| 「root cause」「resolution」「workaround」字眼 | `ragSearch(query="...", domain="bug_list")` |
| 「RDReport」「SEReport」 | `ragSearch(query="...", domain="bug_list")` |

## 跟 issue_tracker / web 的差異

- **`bug_list`**：BugList 系統，欄位結構化（Title / RootCause / Resolution / …）
- **`issue_tracker`**：較廣義的工程 Issue、客訴、測試失敗
- **`web`**：內部網頁、SOP、Wiki

不確定就**兩個 domain 各搜一次**（先 `bug_list`，再 `issue_tracker`），比對之後合併答案。

## 範例

```
使用者：HX9200 最近有沒有 I2C ACK 失敗的 bug？

→ ragSearch(query="HX9200 I2C ACK 失敗", domain="bug_list", top_k=8)
  （若結果不足，再追加）
→ ragSearch(query="HX9200 I2C 通訊問題", domain="issue_tracker", top_k=5)
```

```
使用者：Bug 23456 的 root cause 是什麼？

→ ragSearch(query="Bug 23456 root cause", domain="bug_list", top_k=3)
```

## 注意

- bug 編號帶進 query（例如 `Bug 23456` 而非只搜「23456」），有助於命中 Title 欄位
- root cause、resolution、workaround 等英文關鍵字直接放進 query，向量庫的欄位 metadata 會強化匹配
- 若使用者想要「整理過的答案」而不是原始片段，改用 `ragAsk`（會走完整 LangGraph 流程）
