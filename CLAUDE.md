# opencode-yc — Claude Code Operating Manual

## Startup Workflow

Before writing any code, complete these steps in order:

1. Read this file top to bottom
2. Read `session-handoff.md` — quick state of last session
3. Read `AGENTS.md` — coding style, TypeScript patterns, testing rules
4. Read `progress.md` — detailed session history
5. Read `feature_list.json` — identify what is active or next
6. Pick ONE feature to work on — confirm with user before starting
7. If starting a new feature: copy `docs/exec-plans/TEMPLATE.md` → fill it out first
8. Only then write code

## Project Context

opencode is an open-source AI coding agent. This fork (opencode-yc) extends it to:
- Integrate rag_work as a Q&A backend (via POST /retrieval/metadata)
- Add multi-turn conversation memory
- Add daily scheduled agent workflows

**Stack:** TypeScript, Bun, Effect, SolidJS, Turbo monorepo, SST

## Architecture

```
packages/
  core/           — Agent runtime, session, tool implementations, provider adapters
  app/            — Web UI (SolidJS + Vite + Tailwind)
  desktop/        — Desktop app (Electron)
  console/        — Cloud console (SolidJS + SST + Drizzle + Cloudflare)
  sdk/js/         — JavaScript/TypeScript SDK
  slack/          — Slack integration
```

Key directories in `packages/core/src/`:
- `session/`    — Conversation session management
- `provider/`   — LLM provider adapters
- `tool/`       — Agent tool implementations
- `config/`     — Settings and configuration (follow self-export pattern)

Custom extensions live in `packages/core/src/` and `packages/app/src/`.

## Working Rules

- **One feature at a time.** Never touch unrelated code.
- **No half-finished work.** A feature is done only when it passes verification.
- **Follow AGENTS.md** for all TypeScript/Bun patterns and style decisions.
- **Tests run from package dirs**, not repo root (root `bun test` is disabled by design).
- **Effect-first.** Use Effect library patterns consistent with existing code.
- **No breaking API/SDK changes** without explicit user approval.
- **Update progress.md** at end of every session — this is the handoff artifact.
- **Env vars via `.env`.** Never hardcode secrets or endpoints.

## Verification Commands

```bash
# From repo root:
bun run lint              # oxlint — must be clean
bun run typecheck         # bun turbo typecheck — must pass

# From package directory (e.g., packages/core):
bun test                  # unit tests for that package

# Dev servers:
bun run dev               # opencode CLI (packages/opencode)
bun run dev:web           # Web UI on localhost (packages/app)
bun run dev:desktop       # Desktop app (packages/desktop)
```

## Definition of Done

**A feature is DONE only when ALL of these are true. No exceptions.**

1. `bun run lint` from root — clean
2. `bun run typecheck` from root — no errors
3. `bun test` in relevant package(s) — all pass
4. Manual test performed — document exact steps + result in `progress.md`
5. `feature_list.json` status updated to `done` with `evidence` field filled
6. `progress.md` updated with what was done

**Writing tests is not optional.** Every new exported function or module needs a test.

## Library References

When touching these libraries, read the project-specific notes first:

| Library | File |
|---|---|
| Effect.ts | `docs/references/effect.md` |

## Architecture Docs

| Scope | File |
|---|---|
| System overview | `ARCHITECTURE.md` |
| packages/core | `packages/core/ARCHITECTURE.md` |
| packages/app | `packages/app/ARCHITECTURE.md` |

## End-of-Session Procedure

Run `/done` — it will handle all steps automatically.
