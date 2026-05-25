# System Architecture

## Overview

opencode-yc is a fork of opencode — an open-source AI coding agent. This fork extends it with RAG Q&A integration (via rag_work), multi-turn memory, and daily scheduled workflows.

## Runtime Architecture

```
┌─────────────────────────────────────────────────────────┐
│  Client Layer                                           │
│  Desktop (Electron)  │  Web UI (packages/app)           │
│  └─ spawns server    │  └─ connects via SDK             │
└──────────┬───────────┴──────────┬──────────────────────┘
           │  spawnLocalServer    │  HTTP + SSE events
           ▼                      ▼
┌─────────────────────────────────────────────────────────┐
│  opencode Server  (packages/opencode / @opencode-ai/core)│
│  Session Manager → LLM Provider → Tool Executor        │
│  Config (XDG)     Effect.ts DI   Bash/FS/Edit tools    │
└─────────────────────────────────────────────────────────┘
           │
           ▼  (opencode-yc 新增)
┌─────────────────────────────────────────────────────────┐
│  rag_work backend  (localhost:8000)                     │
│  POST /api/v1/retrieval/metadata → vector search result │
└─────────────────────────────────────────────────────────┘
```

## Package Map

| Package | Role | Key Tech |
|---|---|---|
| `packages/core` | Shared utilities: Effect layers, filesystem, npm, flags | Effect.ts, XDG |
| `packages/app` | Web UI served by opencode server | SolidJS, Vite, Tailwind |
| `packages/desktop` | Electron wrapper, spawns server, IPC | Electron, electron-vite |
| `packages/console` | Cloud management console (hosted) | SST, Drizzle, Cloudflare |
| `packages/sdk/js` | TypeScript SDK for opencode server API | Hono, Zod |

## Data Flow: Conversation

```
User input (Web UI / Desktop)
  → SDK.client.session.chat(message)
  → HTTP POST to opencode server
  → Session Manager processes turn
  → LLM Provider call (Claude / OpenAI / etc)
  → Tool calls executed (Bash, Edit, Read...)
  → [opencode-yc] RAG tool → POST rag_work /retrieval/metadata
  → Response streamed back via SSE
  → Web UI renders message timeline
```

## Effect.ts Dependency Injection Pattern

All services in `packages/core` follow this pattern:

```ts
// Define service interface
export class MyService extends Context.Service<MyService, Interface>()("@opencode/MyService") {}

// Create a Layer (provider)
export const layer = Layer.effect(MyService, Effect.gen(function* () {
  const global = yield* Global.Service
  // ... setup
  return MyService.of({ ... })
}))
```

Layers are composed at startup via `Layer.provide`. Never instantiate services directly.

## Extension Points for opencode-yc

Custom features attach here:
- **New tool**: add to tool registry in `packages/opencode/src/tool/`
- **New provider integration**: extend `packages/opencode/src/provider/`
- **UI changes**: `packages/app/src/pages/session/` or new context in `packages/app/src/context/`
- **Scheduled jobs**: new package or script under `packages/` or `scripts/`

## Config / State Locations (XDG)

| Purpose | Path |
|---|---|
| Config | `~/.config/opencode/` |
| State | `~/.local/state/opencode/` |
| Data | `~/.local/share/opencode/` |
| Cache | `~/.cache/opencode/` |
