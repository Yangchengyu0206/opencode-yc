執行 session 結尾流程。依序做以下五件事，不要跳過任何一步：

## 步驟 1：查看本 session 的變更

執行以下指令，了解實際改動了什麼：
- `git status` — 看哪些檔案有變動
- `git diff HEAD` — 看未 staged 的變更內容
- `git diff --cached` — 看已 staged 的變更內容

## 步驟 2：更新 progress.md

根據對話內容與 git diff，更新 `progress.md`：
- `## Last Updated` — 改成今天日期 + 一句話摘要
- `## Completed (Recent)` — 在最上方插入這個 session 做的事（每項一行）
- `## In Progress` — 若有未完成的事就寫，沒有就填「None」
- `## Blockers / Risks` — 若有風險或阻礙就記下來
- `## Files Modified` — 列出本 session 動到的檔案
- `## Recommended Next Step` — 寫下次應該先做什麼

## 步驟 3：更新 feature_list.json

根據本 session 的工作，更新 `feature_list.json` 中相關 feature 的：
- `status` — 若功能已完成改為 `"done"`，進行中改為 `"active"`
- `evidence` — 補上具體的實作說明（檔案名、方法名、關鍵改動）

## 步驟 4：驗證指令

執行並記錄結果：
```
bun run lint
bun run typecheck
```
若有相關 package 的測試，也在那個目錄下跑 `bun test`。

## 步驟 5：產生繁體中文 git commit message 並顯示

根據實際 diff 內容，用繁體中文寫一個完整的 commit message：
- 第一行：`類型(範圍): 一句話摘要`（50 字以內）
- 空行
- bullet points 列出每項具體變更（用 `-` 開頭）

**只顯示 commit message，不要執行 git commit，不要 git push。**

最後告訴使用者：「完成，請確認 commit message 後自行執行 git commit。」
