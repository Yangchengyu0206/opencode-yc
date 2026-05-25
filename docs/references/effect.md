# Effect.ts — Project-Specific Reference

Effect.ts (`effect` package) is used throughout `packages/core` and `packages/opencode` for dependency injection, async error handling, and service composition.

## Core Patterns in This Codebase

### 1. Context.Service — Define a Service

```ts
import { Context, Effect, Layer } from "effect"

export interface FooInterface {
  readonly doThing: (x: string) => Effect.Effect<string, Error>
}

export class FooService extends Context.Service<FooService, FooInterface>()("@opencode/Foo") {}
```

- The string `"@opencode/Foo"` is the unique service tag — must be globally unique
- `FooInterface` defines what callers can call

### 2. Layer — Implement a Service

```ts
export const layer = Layer.effect(
  FooService,
  Effect.gen(function* () {
    // Depend on other services
    const global = yield* Global.Service
    const bar = yield* BarService

    return FooService.of({
      doThing: (x) => Effect.succeed(`result: ${x}`),
    })
  }),
)
```

### 3. Effect.gen — Write async-style code

```ts
const program = Effect.gen(function* () {
  const foo = yield* FooService
  const result = yield* foo.doThing("hello")
  return result
})
```

### 4. Layer.provide — Compose layers

```ts
// Provide dependencies bottom-up
const appLayer = layer.pipe(
  Layer.provide(BarService.layer),
  Layer.provide(Global.layer),
)
```

### 5. Running Effects

```ts
import { Effect, Layer, ManagedRuntime } from "effect"

const runtime = ManagedRuntime.make(appLayer)
const result = await runtime.runPromise(program)
```

In test files, use the test runtime from `test/lib/effect.ts`.

## Error Handling

```ts
// Define typed errors
export class FooError extends Data.TaggedError("FooError")<{ message: string }> {}

// Catch specific errors
effect.pipe(
  Effect.catchTag("FooError", (e) => Effect.succeed("fallback"))
)
```

## Key Rules (from AGENTS.md)

- Use `Effect.gen` + `yield*` for all async code — no `async/await` inside Effect programs
- Never call `.pipe(Effect.runPromise)` directly in service code — only at program entry point
- Prefer `Layer.effect` over `Layer.succeed` when initialization has side effects
- Use `Context.Service` pattern for any shared stateful resource (DB connection, HTTP client, etc.)

## Useful Operators

| Operator | Purpose |
|---|---|
| `Effect.succeed(v)` | Wrap a value |
| `Effect.fail(e)` | Fail with typed error |
| `Effect.sync(() => ...)` | Wrap sync computation |
| `Effect.tryPromise(...)` | Wrap a Promise, catch as Cause |
| `Effect.all([...])` | Run effects in parallel |
| `Effect.flatMap(f)` | Chain effects |
| `Effect.map(f)` | Transform success value |
| `Effect.tap(f)` | Side effect without changing value |
| `Layer.merge(a, b)` | Merge two layers |
| `Layer.provide(dep)` | Inject dependency into layer |

## Official Docs

- https://effect.website/docs
- https://effect.website/docs/guides/context-management/services
