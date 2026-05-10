import { z } from "zod"
import { MS_CONFIG_PATH, loadMsConfig } from "./_config"

export default {
  description: `查詢 GitLab 的 Merge Request、Issue 與專案資訊（GitLab REST API v4）。

需要在 ms_config.json 設定 gitlab_access_token。
適用情境：
- 列出你參與的專案
- 搜尋特定關鍵字的 MR 或 Issue
- 取得 MR / Issue 詳細資訊

設定方式：在 ms_config.json 加入
  "gitlab_access_token": "glpat-xxxxxxxxxxxxxxxxxxxx"
  "gitlab_base_url": "https://gitlab.com"（公司自架 GitLab 請改成內網 URL）

取得 Token：GitLab → User Settings → Access Tokens → 勾選 api scope`,

  args: {
    action: z.enum(["list_projects", "search_mr", "search_issue", "get_mr", "get_issue"]).describe(
      "操作類型：list_projects（列出專案）、search_mr（搜尋 MR）、search_issue（搜尋 Issue）、get_mr（MR 詳情）、get_issue（Issue 詳情）"
    ),
    project_id: z.string().optional().describe("GitLab 專案 ID 或路徑（如 123 或 group/project），search_mr / search_issue / get_mr / get_issue 需要"),
    query: z.string().optional().describe("搜尋關鍵字（search_mr / search_issue 用）"),
    state: z.enum(["opened", "closed", "merged", "all"]).optional().default("opened").describe("狀態篩選（預設 opened）"),
    iid: z.number().optional().describe("MR 或 Issue 的 IID 編號（get_mr / get_issue 用）"),
    count: z.number().optional().default(10).describe("回傳筆數（預設 10，上限 50）"),
  },

  async execute(args: any) {
    const config = loadMsConfig()
    const token = config?.gitlab_access_token
    if (!token) {
      return `[GitLab 尚未設定] 請在 ${MS_CONFIG_PATH} 填入 gitlab_access_token。\n取得方式：GitLab → User Settings → Access Tokens → api scope`
    }
    const baseUrl = (config?.gitlab_base_url ?? "https://gitlab.com").replace(/\/$/, "")
    const headers: Record<string, string> = { "PRIVATE-TOKEN": token, "Content-Type": "application/json" }
    const top = Math.min(args.count ?? 10, 50)

    const fetchGL = async (path: string) => {
      const res = await fetch(`${baseUrl}/api/v4${path}`, { headers, signal: AbortSignal.timeout(15000) })
        .catch((err: any) => { throw new Error(`GitLab 連線失敗：${err.message}`) })
      if (res.status === 401) throw new Error("GitLab token 無效或過期，請更新 gitlab_access_token")
      if (res.status === 404) throw new Error("找不到指定的專案或資源，請確認 project_id")
      if (!res.ok) {
        const err = await res.text().catch(() => res.statusText)
        throw new Error(`GitLab API 錯誤 (${res.status}): ${err}`)
      }
      return res.json()
    }

    const encId = (id: string) => encodeURIComponent(id)

    if (args.action === "list_projects") {
      const data = await fetchGL(`/projects?membership=true&per_page=${top}&order_by=last_activity_at&sort=desc`)
      if (!data.length) return "找不到你參與的專案（確認 token 已啟用 api scope）"
      const lines = [`## 你的 GitLab 專案（${data.length} 個）\n`]
      for (const p of data) {
        lines.push(`**${p.name_with_namespace}**（ID: ${p.id}）`)
        lines.push(p.web_url)
        if (p.description) lines.push(p.description.slice(0, 100))
        lines.push("")
      }
      return lines.join("\n")
    }

    if (!args.project_id) throw new Error("此操作需要提供 project_id")

    if (args.action === "search_mr") {
      let path = `/projects/${encId(args.project_id)}/merge_requests?state=${args.state ?? "opened"}&per_page=${top}&order_by=updated_at&sort=desc`
      if (args.query) path += `&search=${encodeURIComponent(args.query)}`
      const data = await fetchGL(path)
      if (!data.length) return `找不到符合條件的 Merge Request`
      const lines = [`## GitLab MR（${data.length} 筆）\n`]
      for (const mr of data) {
        lines.push(`**!${mr.iid} ${mr.title}**`)
        lines.push(`狀態：${mr.state}　作者：${mr.author?.name}　更新：${mr.updated_at?.slice(0, 10)}`)
        lines.push(`分支：${mr.source_branch} → ${mr.target_branch}`)
        if (mr.labels?.length) lines.push(`標籤：${mr.labels.join(", ")}`)
        lines.push(mr.web_url)
        lines.push("")
      }
      return lines.join("\n")
    }

    if (args.action === "search_issue") {
      let path = `/projects/${encId(args.project_id)}/issues?state=${args.state ?? "opened"}&per_page=${top}&order_by=updated_at&sort=desc`
      if (args.query) path += `&search=${encodeURIComponent(args.query)}`
      const data = await fetchGL(path)
      if (!data.length) return `找不到符合條件的 Issue`
      const lines = [`## GitLab Issue（${data.length} 筆）\n`]
      for (const issue of data) {
        lines.push(`**#${issue.iid} ${issue.title}**`)
        lines.push(`狀態：${issue.state}　作者：${issue.author?.name}　更新：${issue.updated_at?.slice(0, 10)}`)
        if (issue.labels?.length) lines.push(`標籤：${issue.labels.join(", ")}`)
        if (issue.assignees?.length) lines.push(`指派：${issue.assignees.map((a: any) => a.name).join(", ")}`)
        if (issue.description) lines.push(issue.description.slice(0, 200))
        lines.push(issue.web_url)
        lines.push("")
      }
      return lines.join("\n")
    }

    if (args.action === "get_mr") {
      if (!args.iid) throw new Error("get_mr 需要提供 iid")
      const mr = await fetchGL(`/projects/${encId(args.project_id)}/merge_requests/${args.iid}`)
      const notes = await fetchGL(`/projects/${encId(args.project_id)}/merge_requests/${args.iid}/notes?per_page=5&sort=desc`)
        .catch(() => [])
      const lines = [
        `## MR !${mr.iid}: ${mr.title}`,
        `**狀態**：${mr.state}　**作者**：${mr.author?.name}`,
        `**分支**：${mr.source_branch} → ${mr.target_branch}`,
        `**建立**：${mr.created_at?.slice(0, 16)}　**更新**：${mr.updated_at?.slice(0, 16)}`,
        mr.labels?.length ? `**標籤**：${mr.labels.join(", ")}` : "",
        mr.assignees?.length ? `**指派**：${mr.assignees.map((a: any) => a.name).join(", ")}` : "",
        "",
        mr.description ? `### 說明\n${mr.description.slice(0, 1000)}` : "（無說明）",
        "",
        mr.web_url,
      ]
      if (notes.length) {
        lines.push("", `### 最新留言`)
        for (const n of notes.slice(0, 3)) {
          if (n.system) continue
          lines.push(`**${n.author?.name}**（${n.created_at?.slice(0, 10)}）：${n.body?.slice(0, 200)}`)
        }
      }
      return lines.filter(l => l !== undefined && l !== null).join("\n")
    }

    if (args.action === "get_issue") {
      if (!args.iid) throw new Error("get_issue 需要提供 iid")
      const issue = await fetchGL(`/projects/${encId(args.project_id)}/issues/${args.iid}`)
      const lines = [
        `## Issue #${issue.iid}: ${issue.title}`,
        `**狀態**：${issue.state}　**作者**：${issue.author?.name}`,
        `**建立**：${issue.created_at?.slice(0, 16)}　**更新**：${issue.updated_at?.slice(0, 16)}`,
        issue.labels?.length ? `**標籤**：${issue.labels.join(", ")}` : "",
        issue.assignees?.length ? `**指派**：${issue.assignees.map((a: any) => a.name).join(", ")}` : "",
        "",
        issue.description ? `### 說明\n${issue.description.slice(0, 1000)}` : "（無說明）",
        "",
        issue.web_url,
      ]
      return lines.filter(l => l !== undefined && l !== null).join("\n")
    }

    throw new Error(`未知的操作：${args.action}`)
  },
}
