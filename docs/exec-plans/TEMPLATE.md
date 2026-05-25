# Exec Plan: [Feature Name] ([Feature ID])

> 每個 feature 開工前複製這個 template，存為 `docs/exec-plans/F<ID>-<slug>.md`。
> 寫完再開始寫 code，scope 不清楚先跟使用者確認。

## Overview

**Feature ID:** F__  
**Status in feature_list.json:** active  
**Started:** YYYY-MM-DD  
**Target done:** YYYY-MM-DD  

一句話描述這個 feature 做什麼、為什麼重要。

## Scope

**In scope:**
- 具體改動 A
- 具體改動 B

**Out of scope (explicitly):**
- 這次不做的事
- 誘人但先緩的重構

## Files to Touch

| File | Change |
|------|--------|
| `packages/core/src/foo.ts` | 新增 X method |
| `packages/app/src/context/bar.tsx` | 新增 reactive store |
| `packages/core/test/foo.test.ts` | 新增單元測試 |
| `feature_list.json` | 更新 status |
| `progress.md` | 更新 session log |

## Implementation Steps

- [ ] Step 1: ...
- [ ] Step 2: ...
- [ ] Step 3: 寫對應 package 的單元測試
- [ ] Step 4: `bun run lint && bun run typecheck` — 必須全過
- [ ] Step 5: 手動測試（記錄具體操作步驟與結果）
- [ ] Step 6: 更新 `feature_list.json` status → `done` with evidence
- [ ] Step 7: 更新 `progress.md`

## Test Plan

Unit tests to write:
- `packages/<pkg>/test/<feature>.test.ts` — test case 1
- `packages/<pkg>/test/<feature>.test.ts` — test case 2

Manual verification:
```
操作步驟：
1. ...
2. ...

預期結果：
- ...
```

## Risks & Decisions

| Risk | Mitigation |
|------|-----------|
| 可能破壞 X | 改 X 之前先加 regression test |

## Verification Evidence

> 完成後填這裡。

```
bun run lint output:
...

bun run typecheck output:
...

bun test output (packages/xxx):
...passed, 0 failed
```

Manual test result: [描述操作 + 結果]
