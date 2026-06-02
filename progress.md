# Progress Log

## Last Updated
2026-06-02 — Windows 部屬鏈修復（install.bat 路徑 bug、Inno Setup 安裝包、DeepSeek reasoning capability）

## Current Objective
完成 opencode 內部部屬鏈：跨機器一致地在 Windows 上把 himax + huggingface provider 跑起來。

## Current State

- **Branch:** test_deploy (fork: opencode-yc)
- **Status:** Deploy 基礎建設完成。install.bat 路徑 bug 已修，Inno Setup 安裝包已產出 36.7 MB 單一檔案。DeepSeek V4 Pro reasoning capability 已補正，但跨機器端對端驗證待用戶實測。

## Completed (Recent)

- [deploy] 修 install.bat 致命路徑 bug：`OPENCODE_CONFIG_DIR` 從 `%APPDATA%\opencode` 改為 `%USERPROFILE%\.config\opencode`（opencode runtime 在 Windows 上的 xdgConfig 真實路徑）
- [deploy] install.bat 新增清舊檔邏輯：主動刪除 `~/.config/opencode/{config.json, opencode.json}` 與 `%APPDATA%\opencode\opencode.{jsonc,json}`，杜絕舊安裝的失效 token 殘留
- [deploy] 新增 Inno Setup 安裝腳本 `installer/opencode-setup.iss`，產出 `opencode-setup.exe`（36.7 MB），支援 `/SILENT` 給企業大量部屬
- [provider] 修 `deployment-defaults.ts` 內 DeepSeek V4 Pro 的 capability：`reasoning: true` + `interleaved: { field: "reasoning_content" }`，讓 opencode 認得 reasoning 串流
- [build] 重編 opencode.exe（test_deploy-202606020115），同步到 `C:\Users\YANG\Desktop\deploy\`
- [harness] 之前 session：初始化 CLAUDE.md、feature_list.json、progress.md、.claude/ 目錄

## In Progress

None — 部屬鏈修復本身完成，等用戶在另一台機器跑 setup.exe 驗證 DeepSeek 端對端能用。

## Blockers / Risks

- **DeepSeek 端對端驗證未完成**：reasoning capability 與路徑都修了，但本 session 沒在本機跑完一次 setup.exe → 開 opencode → 發訊息得到回覆的完整流程。若用戶實測仍卡，要回頭看 reasoning 串流的 transform 處理。
- **`C:\Users\YANG` 家目錄 snapshot 拖慢回應 60-90 秒**：opencode 對 home 做 git snapshot 撞鎖、超時。建議用戶用實際專案目錄打開 opencode。
- **opencode.exe 版本資訊顯示 "Bun"**：bun --compile 沒設 metadata，Inno Setup RestartManager 把 opencode 認成 Bun。已用 `CloseApplicationsFilter` 緩解，但長期應在 build.ts 加版本資訊。

## Files Modified

- install.bat — 路徑修正 + 清舊檔
- packages/opencode/src/config/deployment-defaults.ts — DeepSeek reasoning capability
- installer/opencode-setup.iss — 新檔（Inno Setup 安裝腳本）
- （產物同步）C:\Users\YANG\Desktop\deploy\{opencode.exe, opencode-setup.exe, install.bat}

## Recommended Next Step

1. 用 `deploy\opencode-setup.exe` 在那台機器重裝，發訊息確認 DeepSeek 可用（推薦輸入 `hi` 而非 `1234`，比較容易快速看到 content 回覆）。
2. 若仍卡：抓 `~/.local/share/opencode/log/` 最新 log，看 message.part.delta 內容是否真有 reasoning text。
3. 巡視 `deployment-defaults.ts` 其他模型 reasoning capability 是否標對（Qwen3-VL-32B 嫌疑最大）。
4. 在 `packages/opencode/script/build.ts` 加 Windows PE 版本資訊（ProductName / FileDescription），讓 Task Manager / Inno Setup 不再顯示 "Bun"。
