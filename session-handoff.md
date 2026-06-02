# Session Handoff

> 每次 session 結束時填寫，下次 session 開始先讀這裡。

## Last Updated
2026-06-02 — 修復 Windows 部屬路徑 bug、新增 Inno Setup 安裝包、修正 DeepSeek reasoning 設定

## Current Objective
完成 opencode 內部部屬鏈：跨機器一致地讓 DeepSeek V4 Pro (Novita via HF) 在 Windows 上能立即可用。

## Completed This Session

- **install.bat 修復路徑致命 bug**：opencode (bun runtime) 在 Windows 上把 xdgConfig 解析為 `%USERPROFILE%\.config\opencode`，但原 install.bat 把 `opencode.jsonc`（API keys）寫到 `%APPDATA%\opencode\`，導致 opencode 永遠讀不到新 token、繼續沿用舊機殘留的失效 token，DeepSeek 連不上。改 `OPENCODE_CONFIG_DIR=%CONFIG_DIR%`。
- **install.bat 主動清舊檔**：新增邏輯刪掉 `~/.config/opencode/{config.json, opencode.json}` 與 `%APPDATA%\opencode\opencode.{jsonc,json}`，避免舊安裝殘留的失效 token poison 合併後的 config。
- **新增 Inno Setup 安裝包**：`installer/opencode-setup.iss`，編譯後產出 `opencode-setup.exe`（36.7 MB，LZMA2 壓縮）。內建 Pascal 邏輯讀 `.env`、寫 `opencode.jsonc`、設環境變數、加入 PATH。支援 `/SILENT` 給 SCCM/Intune 大量部屬。
- **修 DeepSeek V4 Pro 模型 capability 旗標**：`deployment-defaults.ts` 把 `reasoning: false` 改 `true` 並加 `interleaved: { field: "reasoning_content" }`。原本標錯導致 opencode 不認 reasoning 串流欄位，UI 看似永遠卡住。
- **重編 opencode.exe**（v0.0.0-test_deploy-202606020115）並同步到 `C:\Users\YANG\Desktop\deploy\`。

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
