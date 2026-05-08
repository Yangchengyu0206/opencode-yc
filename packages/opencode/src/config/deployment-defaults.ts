import type { Info } from "./config"

// Deployment-baked defaults for internal build.
// Merged first in loadInstanceState — user global config and project configs override these.
//
// HuggingFace is opt-in: set HF_TOKEN env var or add to ~/.config/opencode/opencode.json
export const DEPLOYMENT_DEFAULTS = {
  enabled_providers: ["himax", "huggingface"],
  model: "himax/openai/gpt-oss-120b",
  small_model: "himax/openai/gpt-oss-20b",
  // HuggingFace fallback (used only if himax is unreachable)
  // model: "huggingface/Qwen/Qwen2.5-72B-Instruct",
  provider: {
    himax: {
      name: "Himax Internal",
      npm: "@ai-sdk/openai-compatible",
      api: "https://llm.ai.himax.com.tw/v1",
      env: [],
      options: {
        apiKey: "3e2fc0f6-77a7-4279-a1f0-53c53b5450bd",
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
        apiKey: process.env.HF_TOKEN ?? "",
        baseURL: "https://router.huggingface.co/v1",
      },
      whitelist: [
        "Qwen/Qwen2.5-72B-Instruct",
        "meta-llama/Llama-3.3-70B-Instruct",
        "mistralai/Mistral-7B-Instruct-v0.3",
      ],
      models: {
        "Qwen/Qwen2.5-72B-Instruct": {
          name: "Qwen2.5 72B",
          tool_call: true,
          attachment: false,
          reasoning: false,
          temperature: true,
          limit: { context: 131072, output: 8192 },
        },
        "meta-llama/Llama-3.3-70B-Instruct": {
          name: "Llama 3.3 70B",
          tool_call: true,
          attachment: false,
          reasoning: false,
          temperature: true,
          limit: { context: 131072, output: 8192 },
        },
        "mistralai/Mistral-7B-Instruct-v0.3": {
          name: "Mistral 7B",
          tool_call: true,
          attachment: false,
          reasoning: false,
          temperature: true,
          limit: { context: 32768, output: 8192 },
        },
      },
    },
  },
} satisfies Info
