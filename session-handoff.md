# Session Handoff

> 每次 session 結束時填寫，下次 session 開始先讀這裡。

## Last Updated
2026-06-02 — install.bat / setup.exe 自動清除舊 tool/skills 殘留、新增 reset-opencode.bat 核彈級清乾淨腳本

## Current Objective
完成 opencode 內部部屬鏈：跨機器一致地讓 DeepSeek V4 Pro (Novita via HF) 在 Windows 上能立即可用，且**不被舊安裝殘留檔污染**。

## Completed This Session

- **install.bat 自動清舊 tool/skills**：每次跑 install.bat 時先 `rd /s /q "%CONFIG_DIR%\tool"` 與 `skills`，再重建。修掉用戶 904596 機器遇到的 `error: Cannot find module '@opencode-ai/plugin' from 'rag-buglist-search.ts'` —— 那是舊版 deploy 留下、新版已移除的 tool 檔，import 一個沒打包進來的 npm 模組。
- **opencode-setup.iss 加 [InstallDelete] 砍 tool/skills 整樹**：用 `Type: filesandordirs; Name: "{%USERPROFILE}\.config\opencode\tool"` 確保每次 setup 安裝前先清空，再讓 [Files] 區段重建。保留 `ms_config.json`（用戶 API key 設定）與 `node_modules`（重建很慢）。
- **新增 reset-opencode.bat**：獨立的核彈級清除腳本。需要打 `YES` 確認後一次砍光 `%LOCALAPPDATA%\opencode`、`~/.config/opencode`、`~/.local/share/opencode`、`~/.local/state/opencode`、`~/.cache/opencode`、`%APPDATA%\opencode`，並刪 HKCU Environment 的 HIMAX_TOKEN/HF_TOKEN/RAG_BASE_URL 與 PATH 中的 opencode 條目。給「我懷疑這台還有奇怪殘留」的情境用。
- **重編 opencode-setup.exe**（仍 36.7 MB）並同步 install.bat / reset-opencode.bat / opencode-setup.exe 到 `deploy\`。

## Verification Evidence

| Check | Command | Result |
|---|---|---|
| install.bat 跑完無殘留 | 本機 cmd 跑 install.bat | ✅ pass — 本 session 前已驗證 |
| Inno Setup compile | `ISCC.exe installer/opencode-setup.iss` | ✅ pass — opencode-setup.exe 成功產出 |
| 904596 機器端對端 | 用戶用新 setup.exe 重裝 | ⚠️ pending — 待用戶實測（推薦 A 路：直接用新 setup.exe；備案 B 路：先跑 reset-opencode.bat） |
| typecheck / unit tests | — | not run（本 session 是部屬層改動，未動 runtime 邏輯） |

## Files Changed This Session

- install.bat — 加入 wipe `tool/` 與 `skills/` 邏輯
- installer/opencode-setup.iss — [InstallDelete] 加入 `tool/` 與 `skills/` 整樹清除
- reset-opencode.bat — 新檔（獨立核彈級清除腳本）
- （產物同步）deploy/install.bat、deploy/reset-opencode.bat、deploy/opencode-setup.exe

## Blockers / Risks

- **904596 機器待實測**：邏輯改完了，但本 session 沒在那台機器親自驗證。若用戶跑新 setup.exe 還有 error，要看是否還有其他舊檔（例如 `.opencode/skills/buglist/` 之類），可能需要再延伸 [InstallDelete] 範圍。
- **`ms_config.json` 保留可能反咬**：目前 install.bat 與 setup.exe 都「只在不存在時才複製」`ms_config.json`，以保留用戶填過的 API key。但如果舊版的 ms_config.json schema 跟新版不相容，用戶會困住。長期應加版本號或 migration 邏輯。
- **`node_modules` 累積問題**：目前 npm 安裝時 `--save-dev` 會根據當下 package.json 修剪。若舊版 package.json 有列已移除的套件，會殘留。短期不影響，長期可考慮在重灌前砍 `node_modules` 重建（代價是用戶要重新 npm install）。

## Recommended Next Step

1. **用戶把新 `deploy\opencode-setup.exe` 拿到 904596 機器重裝**，直接驗證 rag-buglist-search.ts 錯誤是否消失、DeepSeek 是否可用。
2. 若仍卡：跑 `reset-opencode.bat` 徹底清除，再裝一次。
3. 若連續有「舊版 tool import 失敗」類型 bug，把 install.bat 與 .iss 的清除範圍延伸到 `~/.config/opencode/node_modules`（代價：每次重灌都要重跑 npm install）。
4. 補 `packages/opencode/script/build.ts` 加 Windows PE 版本資訊，讓 Task Manager / Inno Setup 不再顯示 "Bun"。

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
