---
name: gitlab
description: Use this skill when the user asks about GitLab repositories, merge requests, issues, pipelines, or code reviews.
---

# GitLab 操作指引

## 設定方式

在 `~/.config/opencode/ms_config.json` 加入：

```json
{
  "gitlab_access_token": "glpat-xxxxxxxxxxxxxxxxxxxx",
  "gitlab_base_url": "https://gitlab.com"
}
```

取得 Access Token：GitLab → User Settings → Access Tokens → 勾選 `api` scope → 建立

公司自架 GitLab 請將 `gitlab_base_url` 改為內網 URL（如 `http://gitlab.internal`）。

---

## gitlabSearch 工具操作一覽

| action | 說明 | 必要參數 |
|--------|------|---------|
| `list_projects` | 列出你參與的所有專案 | — |
| `search_mr` | 搜尋 Merge Request | `project_id` |
| `search_issue` | 搜尋 Issue | `project_id` |
| `get_mr` | 取得 MR 詳情 + 最新留言 | `project_id`, `iid` |
| `get_issue` | 取得 Issue 詳情 | `project_id`, `iid` |

`project_id` 可以是數字 ID（如 `123`）或路徑（如 `group/project`）。

---

## 使用範例

```
# 先找專案 ID
gitlabSearch(action="list_projects")

# 搜尋開啟中的 MR
gitlabSearch(action="search_mr", project_id="123", query="fix login")

# 查看特定 MR 詳情
gitlabSearch(action="get_mr", project_id="123", iid=42)

# 搜尋已關閉的 Issue
gitlabSearch(action="search_issue", project_id="group/repo", query="memory leak", state="closed")
```
