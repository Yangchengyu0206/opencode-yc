# Session Handoff

> 每次 session 結束時填寫，下次 session 開始先讀這裡。

## Last Updated
2026-06-02 — ragSearch 補上 bug_list / web domain、新增 buglist skill、deploy 全量同步

## Current Objective
讓 opencode agent 能透過 ragSearch 三庫（bug_list / issue_tracker / web）正確路由，並把整套變更打進 deploy。

## Completed This Session

- **ragSearch.ts domain enum 跟 rag_work 真實庫對齊**：原本 `["datasheet", "issue_tracker"]` 但跟後端 `QDRANT_COLLECTION_MAP` 不匹配。改為 `["bug_list", "issue_tracker", "web"]`（不填 domain → 預設 collection / 規格書）。description 同步補上「何時用哪個 domain」的判斷規則。
- **新增 `.opencode/skills/buglist/SKILL.md`**：專屬 BugList 查詢指引。列出 BugList 欄位（Title / Description / RootCause / Conclusion / Resolution / Workaround / RDReport / SEReport / NotifyToCustomerMessage），給 agent 三條判斷規則表 + 兩個範例，並說明跟 issue_tracker / web 的分工。
- **更新 `.opencode/skills/rag/SKILL.md`**：從 2-domain 改 4-domain 結構說明（不填 / bug_list / issue_tracker / web），示範也改成「找規格書不要填 domain」。
- **deploy 全量同步**：用 robocopy `/E /PURGE` 把 opencode-yc/.opencode 鏡像到 deploy/.opencode（Extras=0，無殘留）。install.bat / reset-opencode.bat MD5 確認 MATCH。重編 opencode-setup.exe（53 秒，36.7 MB）包含上述全部變更。
- **install.bat 自動清舊 tool/skills**：每次跑 install.bat 時先 `rd /s /q "%CONFIG_DIR%\tool"` 與 `skills`，再重建。修掉用戶 904596 機器遇到的 `error: Cannot find module '@opencode-ai/plugin' from 'rag-buglist-search.ts'` —— 那是舊版 deploy 留下、新版已移除的 tool 檔，import 一個沒打包進來的 npm 模組。
- **opencode-setup.iss 加 [InstallDelete] 砍 tool/skills 整樹**：用 `Type: filesandordirs; Name: "{%USERPROFILE}\.config\opencode\tool"` 確保每次 setup 安裝前先清空，再讓 [Files] 區段重建。保留 `ms_config.json`（用戶 API key 設定）與 `node_modules`（重建很慢）。
- **新增 reset-opencode.bat**：獨立的核彈級清除腳本。需要打 `YES` 確認後一次砍光 `%LOCALAPPDATA%\opencode`、`~/.config/opencode`、`~/.local/share/opencode`、`~/.local/state/opencode`、`~/.cache/opencode`、`%APPDATA%\opencode`，並刪 HKCU Environment 的 HIMAX_TOKEN/HF_TOKEN/RAG_BASE_URL 與 PATH 中的 opencode 條目。給「我懷疑這台還有奇怪殘留」的情境用。
- **重編 opencode-setup.exe**（仍 36.7 MB）並同步 install.bat / reset-opencode.bat / opencode-setup.exe 到 `deploy\`。

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| ragSearch enum 改完 git diff | `git diff .opencode/tool/ragSearch.ts` | ✅ enum 從 [datasheet, issue_tracker] 改為 [bug_list, issue_tracker, web] |
| 新 skill 檔內容 | `cat .opencode/skills/buglist/SKILL.md` | ✅ frontmatter + 欄位列表 + 判斷規則表 + 範例都有 |
| Inno Setup recompile | `ISCC.exe installer/opencode-setup.iss` | ✅ 53.7 秒成功產出 opencode-setup.exe |
| deploy 鏡像 | `robocopy .opencode → deploy/.opencode /E /PURGE` | ✅ 3 file changed, 3508 skipped (identical), Extras=0 |
| install.bat / reset-opencode.bat 同步 | MD5 比對 | ✅ MATCH |
| opencode agent 實測新 domain | — | ⚠️ pending — 還沒丟 buglist 相關問題到 agent 看路由是否正確 |
| typecheck / unit tests | — | not run（本 session 是 skill/tool/部屬層改動） |

## Files Changed This Session

- .opencode/tool/ragSearch.ts — domain enum 從 [datasheet, issue_tracker] 改 [bug_list, issue_tracker, web]，description 同步更新
- .opencode/skills/rag/SKILL.md — 改寫成 4-domain 結構說明
- .opencode/skills/buglist/SKILL.md — 新檔（BugList 專屬查詢指引）
- （產物同步）deploy/.opencode/tool/ragSearch.ts、deploy/.opencode/skills/{rag,buglist}/SKILL.md、deploy/opencode-setup.exe（重編）

## Blockers / Risks

- **rag_work `.env` 沒有 `bug_list` domain key**：目前 `QDRANT_COLLECTION_MAP={"web": "web", "issue": "issue"}`，缺 `bug_list`。agent 用 `domain="bug_list"` 查時後端會 fallback 到 default collection（規格書庫），結果不準。需要在 rag_work 端把 `.env` 改成 `{"web": "web", "issue_tracker": "issue", "bug_list": "buglist_collection"}` 之類。**這是 rag_work 端的改動，不在這個 repo**。
- **domain 命名跟 rag_work `.env` key 也不一致**：opencode 用 `issue_tracker`，rag_work 現有 env 是 `issue`。若 rag_work 不改 env，opencode 用 `issue_tracker` 也會 fallback。兩邊得對齊。
- **未實測 agent 端對端**：ragSearch enum 改了、skill 寫了，但沒實測 agent 拿到「Bug 12345 的 root cause」這類問題會不會正確路由到 `domain="bug_list"`。

## Recommended Next Step

1. **同步 rag_work `.env`**：把 `QDRANT_COLLECTION_MAP` key 改成跟 opencode ragSearch enum 對齊的 `bug_list / issue_tracker / web`，並補上 `bug_list` 對應的 collection 名稱（可能是 `buglist_collection`，看 `BUGLIST_COLLECTION` env 預設）。
2. **agent 端對端驗證**：用 `deploy\opencode-setup.exe` 裝完後，丟 buglist 相關問題（如「Bug 12345 的 root cause 是什麼？」），看 agent 是否正確選 `domain="bug_list"`。
3. 若 agent 沒選對 domain：把 `skills/buglist/SKILL.md` 的規則寫得更斬釘截鐵（例如加 trigger keywords 一行）。
4. （延續上次）補 `packages/opencode/script/build.ts` 加 Windows PE 版本資訊。

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| build | `bun run --cwd packages/opencode build --single` | ✅ pass — opencode-windows-x64 smoke test passed |
| install.bat | 在本機 cmd 跑 install.bat | ✅ pass — `~/.config/opencode/opencode.jsonc` 寫入新 token，舊 `opencode.json` 已被刪除 |
| HF API token | curl `https://router.huggingface.co/v1/chat/completions` 用新 token | ✅ HTTP 200，舊 token HTTP 401 |
| Inno Setup compile | `ISCC.exe installer/opencode-setup.iss` | ✅ pass — opencode-setup.exe 產出 |
| DeepSeek end-to-end | opencode TUI 選 DeepSeek 發訊息 | ⚠️ 路徑/token/模型 capability 都對了，但用戶實測 TUI 卡住，待用戶以新 setup.exe 重裝後再驗證 |
| typecheck / unit tests | — | not run（本 session 是部屬層改動，未動 runtime 邏輯） |

## Files Changed This Session

- install.bat — 路徑修正（OPENCODE_CONFIG_DIR）+ 清舊檔邏輯
- packages/opencode/src/config/deployment-defaults.ts — DeepSeek V4 Pro 補上 reasoning + interleaved
- installer/opencode-setup.iss — 新檔（Inno Setup 安裝腳本）
- （產物）C:\Users\YANG\Desktop\deploy\opencode.exe、opencode-setup.exe、install.bat 同步到 deploy 資料夾

## Blockers / Risks

- **DeepSeek reasoning 串流仍待用戶實測驗證**：reasoning + interleaved 補上後，opencode 應該認得 `reasoning_content` 串流欄位，但本 session 沒在這台機器直接重新跑 setup.exe 完整再測一次。若用戶實測仍卡，下一步要看 message.part.delta 內容是否帶 reasoning text，或檢查 transform.ts 對 interleaved 的處理是否需要額外設定。
- **git snapshot 在 home 目錄掃描太慢**：log 顯示 opencode 對 `C:\Users\YANG`（家目錄）做 git snapshot，95 秒才超時。不致命但會拖慢每次互動。建議用戶在實際專案目錄打開 opencode，或改 opencode 預設不對 home 做 snapshot。
- **`opencode.exe` 版本資訊顯示為 "Bun"**：bun --compile 沒帶自訂 metadata，導致 Windows / Inno Setup RestartManager 把 opencode 認成 Bun。已在 .iss 加 `CloseApplicationsFilter=opencode.exe` 緩解，但長期應在 build.ts 加版本資訊。

## Recommended Next Step

1. **用戶先用 `deploy\opencode-setup.exe` 在那台「連不到 DeepSeek」的機器重裝**，再丟一次測試訊息（例如 `hi` 比 `1234` 容易解析）。若回得來，整條部屬鏈就 closed。
2. 若仍卡：拿 `~/.local/share/opencode/log/` 最新 log 看 message.part.delta 是否帶 reasoning text，判斷是 opencode TUI 渲染問題還是 model 真的沒吐 content。
3. 把 deployment-defaults.ts 內其它 Qwen 模型也重新檢視 reasoning capability（Qwen3-VL-32B 可能也標錯）。
4. 在 `packages/opencode/script/build.ts` 加 Windows 版本資訊（ProductName=opencode, FileDescription=opencode），讓 Inno Setup 與 Task Manager 顯示正確名稱。

<!--
TEMPLATE — 不要動下方註解
建議結構：
## Last Updated   YYYY-MM-DD — 一句話摘要
## Current Objective
## Completed This Session
## Verification Evidence — 表格：Check | Command | Result
## Files Changed This Session
## Blockers / Risks
## Recommended Next Step
-->
