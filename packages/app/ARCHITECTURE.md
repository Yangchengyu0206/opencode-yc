# packages/app Architecture

`@opencode-ai/app` — Web UI served by the opencode server. Runs inside Desktop (Electron webview) and as standalone web app.

## Responsibilities

- Render conversation sessions (message timeline, file diffs, tool outputs)
- Provider / model selection UI
- Settings dialogs
- Composer (prompt input with slash commands, file attachments, context items)
- Connect to opencode server via SDK (HTTP + SSE)

## Directory Structure

```
src/
  app.tsx               — Root SolidJS app, context providers tree
  entry.tsx             — Vite entry point
  pages/
    session.tsx         — Main session page (message timeline + composer)
    session/
      message-timeline  — Renders each message turn
      composer/         — Prompt input docks (permission, revert, followup...)
      session-side-panel— File tabs, review tab, terminal panel
    layout.tsx          — Shell layout (sidebar, workspace, project)
    home.tsx            — Landing / directory selector
  components/           — Reusable UI: dialogs, prompt-input, file-tree
  context/
    global-sdk.tsx      — Connects to opencode server, manages SSE event stream
    sdk.tsx             — Per-directory SDK client (wraps global-sdk)
    server.tsx          — Tracks available server connections
    settings.tsx        — App settings reactive store
    sync.tsx            — Syncs server state to local reactive store
    ... (other contexts)
  utils/
    solid-dnd.tsx       — DnD helpers
```

## Context Provider Tree

```
GlobalSDKProvider        ← one global SSE connection to server
  └─ SDKProvider         ← per-directory client (created from GlobalSDK)
       └─ SyncProvider   ← keeps local reactive state in sync with server events
            └─ Pages / Components
```

Key rule: all server communication goes through `useSDK()`. Never call fetch directly in components.

## Adding UI for a New Feature

1. If it needs server data: add the fetch/event in `src/context/sync.tsx` or a new context
2. If it's a new page section: add under `src/pages/session/`
3. If it's a reusable dialog: add under `src/components/dialog-<name>.tsx`
4. Follow existing SolidJS patterns: `createMemo`, `createEffect`, `createSignal` — avoid over-splitting

## Testing

```bash
cd packages/app
bun test              # unit tests (happy-dom)
bun run test:e2e      # Playwright e2e (requires running server)
bun run typecheck     # tsgo type check
```
