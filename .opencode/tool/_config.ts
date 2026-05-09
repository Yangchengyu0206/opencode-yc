import { readFileSync } from "fs"
import { homedir } from "os"
import { join } from "path"

export const MS_CONFIG_PATH = join(homedir(), ".config", "opencode", "ms_config.json")

export const RAG_BASE_URL = process.env.RAG_BASE_URL ?? "http://10.240.235.72:8000"

export function loadMsConfig(): Record<string, any> | null {
  try {
    return JSON.parse(readFileSync(MS_CONFIG_PATH, "utf-8"))
  } catch {
    return null
  }
}

export function graphAuthHeaders(config: Record<string, any>) {
  return {
    Authorization: `Bearer ${config.graph_access_token}`,
    "Content-Type": "application/json",
  }
}
