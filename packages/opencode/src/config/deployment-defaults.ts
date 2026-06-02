import type { Info } from "./config"

// Deployment-baked defaults for internal build.
// Merged first in loadInstanceState — user global config and project configs override these.
//
// HuggingFace is opt-in: set HF_TOKEN env var or add to ~/.config/opencode/opencode.json
export const DEPLOYMENT_DEFAULTS = {
  enabled_providers: ["himax", "huggingface"],
  model: "himax/openai/gpt-oss-120b",
  small_model: "himax/openai/gpt-oss-20b",
  // HuggingFace fallback via Novita routing (no HIMAX VPN/key needed)
  // model: "huggingface/deepseek-ai/DeepSeek-V4-Pro:novita",
  provider: {
    himax: {
      name: "Himax Internal",
      npm: "@ai-sdk/openai-compatible",
      api: "https://llm.ai.himax.com.tw/v1",
      env: ["HIMAX_TOKEN"],
      options: {
        apiKey: process.env.HIMAX_TOKEN || undefined,
        baseURL: "https://llm.ai.himax.com.tw/v1",
        // Disable TLS verification for internal self-signed cert (handled in provider.ts fetch wrapper)
        rejectUnauthorized: false,
      },
      models: {
        "openai/gpt-oss-120b": {
          name: "GPT OSS 120B",
          tool_call: true,
          attachment: false,
          reasoning: false,
          temperature: true,
        },
        "Qwen/Qwen3.5-27B": {
          name: "Qwen3.5 27B",
          tool_call: true,
          attachment: true,
          reasoning: false,
          temperature: true,
          limit: { context: 32768, output: 8192 },
        },
        "Qwen/Qwen-Coder-30B-A3B-Instruct": {
          name: "Qwen-Coder-30B-A3B-Instruct",
          tool_call: true,
          attachment: false,
          reasoning: false,
          temperature: true,
          limit: { context: 131072, output: 8192 },
        },
        "Qwen/Qwen3-VL-32B-Instruct": {
          name: "Qwen3-VL-32B-Instruct",
          tool_call: true,
          attachment: true,
          reasoning: false,
          temperature: true,
          limit: { context: 131072, output: 8192 },
        },
      },
    },
    huggingface: {
      name: "HuggingFace",
      npm: "@ai-sdk/openai-compatible",
      api: "https://router.huggingface.co/v1",
      env: ["HF_TOKEN"],
      options: {
        apiKey: process.env.HF_TOKEN || undefined,
        baseURL: "https://router.huggingface.co/v1",
      },
      whitelist: [
        "deepseek-ai/DeepSeek-V4-Pro:novita",
      ],
      models: {
        "deepseek-ai/DeepSeek-V4-Pro:novita": {
          name: "DeepSeek V4 Pro (Novita via HF)",
          tool_call: true,
          attachment: false,
          reasoning: true,
          interleaved: { field: "reasoning_content" },
          temperature: true,
          limit: { context: 131072, output: 8192 },
        },
      },
    },
  },
} satisfies Info
