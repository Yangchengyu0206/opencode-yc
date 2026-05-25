# packages/core Architecture

`@opencode-ai/core` — Shared utilities and Effect.ts infrastructure used across all packages.

## Responsibilities

- XDG path management (config / data / state / cache / tmp)
- Effect.ts service layer boilerplate and runtime helpers
- Filesystem operations (async, Effect-wrapped)
- npm / package resolution helpers
- Feature flags (`Flag`)
- Observability (OpenTelemetry via Effect)
- Process spawning (cross-spawn wrapper)
- CLI binary entry point (`./bin/opencode`)

## Key Modules

| Module | Purpose |
|---|---|
| `src/global.ts` | XDG paths as Effect.Service; must be provided as first layer |
| `src/filesystem.ts` | File I/O operations |
| `src/flag/flag.ts` | Runtime feature flags via env vars |
| `src/effect/runtime.ts` | Effect runtime setup for Node.js |
| `src/effect/observability.ts` | OpenTelemetry span / trace integration |
| `src/effect/memo-map.ts` | Memoized Effect computations |
| `src/util/flock.ts` | File-based locking (Flock) |
| `src/npm.ts` | npm package resolution and install helpers |

## Effect.ts Layer Pattern (used throughout)

```ts
// 1. Define context tag + interface
export class FooService extends Context.Service<FooService, FooInterface>()("@opencode/Foo") {}

// 2. Implement the layer
export const layer = Layer.effect(
  FooService,
  Effect.gen(function* () {
    const global = yield* Global.Service   // depend on Global
    return FooService.of({
      doSomething: () => Effect.succeed("result"),
    })
  }),
)

// 3. At call site
Effect.gen(function* () {
  const foo = yield* FooService
  yield* foo.doSomething()
})
```

## Adding a New Utility

1. Create `src/<name>.ts` with `export class XxxService extends Context.Service...`
2. Export it as `export * as Xxx from "./<name>"` at the module entry
3. Add a test in `test/<name>.test.ts`
4. Run `bun test` from this directory to verify

## Testing

```bash
cd packages/core
bun test              # all tests
bun test test/foo     # specific file
```

Tests avoid mocks — they test actual implementations against real filesystem/npm behavior.
