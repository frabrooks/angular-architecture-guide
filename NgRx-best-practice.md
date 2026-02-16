

# NgRx Best Practice Guide

This is one of three documents that together provide a comprehensive guide to building Angular applications with NgRx and Signals:

> [Architecture Guide](https://github.com/frabrooks/angular-architecture-guide/blob/main/architecture-guide.md) - which describes a declarative architecture for Angular applications using NgRx and Signals. It covers high-level architectural principles, folder organization, component patterns, orchestration and routing strategy.

> **NgRx Best Practice Guide** (this document) - which introduces NgRx and outlines best practices to aim for and anti-patterns to avoid. You may want to start with this one if you're new to NgRx.

> [Testing Approach Guide](TODO) - which describes how to approach testing in an Angular + NgRx codebase, including patterns for testing components, services, and NgRx artifacts.


## Introduction

This document introduces NgRx from a practical, architecture-aligned perspective.

It is intended primarily for developers who are new to NgRx, or who have used it in small projects but have not yet worked in large, long-lived Angular applications.

This guide should be read alongside the Architecture Guide. The patterns described here assume:

- Feature-driven structure
- Route-driven orchestration
- ViewModel-based components
- Standalone-first Angular

NgRx is not presented here as a “framework to master”, but as a set of tools for building predictable, reviewable, and scalable frontend systems.

---

## Table of Contents

1. Introduction
2. Historical Context
3. Philosophical Origins
4. Introduction to NgRx
   - Actions
   - Effects
   - Reducers
   - Selectors
   - Signals Integration
   - Entity Adapter
5. Anti-patterns to Avoid
6. Debuggability and DevTools
7. Complex Scenarios
8. Unit Testing
9. Appendix

---

## 1. Introduction

### What is NgRx?

NgRx is a state management library for Angular inspired by Redux.

At a high level, it provides:

- A centralized store
- Explicit state transitions
- Predictable side effects
- Time-travel debugging

In practice, NgRx is best understood as:

> A way to make application behaviour explicit and reviewable.

Instead of logic being scattered across components and services, NgRx centralises:

- What happened
- What changed
- What was loaded
- What failed
- What depends on what

### Why Use NgRx?

NgRx is valuable when:

- State is shared across many components
- Data must be cached
- Complex async flows exist
- Behaviour must be auditable
- Teams are large

NgRx is not needed for:

- Simple forms
- One-off UI toggles
- Isolated components
- Local-only state

Do not use NgRx “by default”.
Use it when coordination and predictability matter.

---

## 2. Historical Context

### Redux

NgRx is heavily inspired by Redux.

Redux introduced three core ideas:

1. Single source of truth
2. State is immutable
3. Changes happen via actions

In Redux:

- Actions describe events
- Reducers compute new state
- The store holds everything

NgRx adapts this model to Angular and RxJS.

Key differences:

- Heavy use of observables
- Integration with Angular DI
- Effects for side effects

Understanding Redux helps explain why NgRx looks the way it does.

---

## 3. Philosophical Origins

### Functional Programming

NgRx borrows ideas from functional programming:

- Pure functions
- Immutable data
- No hidden side effects

Reducers and selectors are expected to be pure.

This makes behaviour:

- Predictable
- Testable
- Reviewable

### Declarative Code

NgRx encourages declarative thinking.

Instead of:

> “When X happens, call Y, then Z, unless W…”

You write:

> “When X happens, the state becomes Y, and effects may run Z.”

The system reacts.

You describe policy, not procedure.

### Pure Code vs Side Effects

Pure code:
- Reducers
- Selectors
- Mapping functions

Side effects:
- HTTP
- Storage
- Logging
- Navigation

NgRx separates these deliberately.

Effects are where dangerous things live.

If reducers start doing side effects, the architecture collapses.

---

## 4. Introduction to NgRx

### Actions

Actions represent events.

They answer:

> What just happened?

They do not answer:

> What should happen next?

Example:

### Foo Actions

**foo.actions.ts**

```typescript
export const FooActions = {
  entered: createAction('[Foo] Entered'),

  loadSuccess: createAction(
    '[Foo] Load Success',
    props<{ data: FooData }>()
  ),

  loadFailure: createAction(
    '[Foo] Load Failure',
    props<{ error: unknown }>()
  ),
};
```

Good actions:

- Describe facts
- Are named clearly
- Do not embed logic

Bad actions:

- loadFooNow
- forceRefreshFoo
- doFooThing

These encode commands, not events.

---

### Effects

Effects coordinate side effects.

They listen for actions and perform work.

Effects should:

- Fetch data
- Save data
- Coordinate dependencies
- Handle errors

Effects should not:

- Compute UI state
- Mutate store directly
- Contain business logic

### Basic Effect Example

**foo.effects.ts**

```typescript
@Injectable()
export class FooEffects {

  private readonly actions$ = inject(Actions);
  private readonly api = inject(FooApiService);
  private readonly store = inject(Store);

  loadOnEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FooActions.entered),

      concatLatestFrom(() =>
        this.store.select(FooSelectors.selectLoaded)
      ),

      filter(([, loaded]) => !loaded),

      switchMap(() =>
        this.api.getFooData().pipe(
          map(data => FooActions.loadSuccess({ data })),
          catchError(error =>
            of(FooActions.loadFailure({ error }))
          )
        )
      )
    )
  );
}
```

### Operator Selection

| Operator   | Cancels Previous | Queues | Parallel | Typical Use |
|------------|------------------|--------|----------|-------------|
| switchMap  | Yes              | No     | No       | Route changes |
| exhaustMap | Yes (ignore new) | No     | No       | Button clicks |
| concatMap  | No               | Yes    | No       | Ordered flows |
| mergeMap   | No               | No     | Yes      | Independent tasks |

Choose deliberately.

Default to switchMap unless you know otherwise.

---

### Reducers

Reducers compute new state.

They must be pure.

Example:

**foo.reducer.ts**

```typescript
export const initialState: FooState = {
  data: null,
  loading: false,
  error: null,
  loaded: false,
};

export const fooReducer = createReducer(

  initialState,

  on(FooActions.entered, state => ({
    ...state,
    loading: true,
    error: null,
  })),

  on(FooActions.loadSuccess, (state, { data }) => ({
    ...state,
    data,
    loading: false,
    loaded: true,
  })),

  on(FooActions.loadFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error,
  }))
);
```

Reducers must never:

- Call services
- Read storage
- Generate IDs
- Dispatch actions

---

### Selectors

Selectors are the read API of the store.

Components should never read state directly.

Example:

**foo.selectors.ts**

```typescript
export const selectFooState =
  createFeatureSelector<FooState>('foo');

export const selectFooData =
  createSelector(
    selectFooState,
    state => state.data
  );

export const selectLoaded =
  createSelector(
    selectFooState,
    state => state.loaded
  );

export const selectIsLoading =
  createSelector(
    selectFooState,
    state => state.loading
  );
```

### Memoization

Selectors are memoized.

If inputs don’t change, outputs are reused.

This enables:

- Performance
- Stability
- Predictable rendering

Breaking memoization by recreating selectors dynamically is a common mistake.

---

### Selectors vs Signals

NgRx selectors work with observables.

Modern Angular adds signals.

NgRx provides `selectSignal`.

Example:

```typescript
const fooData = this.store.selectSignal(
  FooSelectors.selectFooData
);
```

Use selectors to define meaning.
Use signals to consume it.

---

### Entity Adapter

Entity adapter simplifies collections.

Example:

**foo.reducer.ts**

```typescript
const adapter = createEntityAdapter<Foo>();

const initialState =
  adapter.getInitialState({
    loading: false,
    error: null,
  });

export const fooReducer = createReducer(

  initialState,

  on(FooActions.loadSuccess, (state, { data }) =>
    adapter.setAll(data, {
      ...state,
      loading: false,
    })
  )
);
```

Benefits:

- Normalized data
- Fast lookups
- Built-in selectors
- Less boilerplate

Use for most collections.

---

## 5. Anti-patterns

### Actions as Commands

Bad:

```typescript
this.store.dispatch(loadFoo());
```

```typescript
loadFoo$ = createEffect(() =>
  this.actions$.pipe(
    ofType(loadFoo),
    switchMap(...)
  )
);
```

Why bad:

- Trigger unclear
- No narrative
- Hard to review

Good:

```typescript
this.store.dispatch(FooActions.entered());
```

```typescript
loadOnEntry$ = createEffect(() =>
  this.actions$.pipe(
    ofType(FooActions.entered),
    ...
  )
);
```

---

### ngOnInit Chaos

Bad:

```typescript
ngOnInit() {
  this.store.dispatch(loadA());
  this.store.dispatch(loadB());
  this.store.dispatch(loadC());

  this.a$ = this.store.select(selectA);
  this.b$ = this.store.select(selectB);
  this.c$ = this.store.select(selectC);
}
```

This creates:

- Hidden dependencies
- Duplicate loading
- No orchestration

Use route-driven effects instead.

---

### Derived State in Store

Bad:

```typescript
on(loadSuccess, (state, { data }) => ({
  ...state,
  data,
  hasItems: data.length > 0
}))
```

Good:

```typescript
export const selectHasItems =
  createSelector(
    selectFooData,
    data => data.length > 0
  );
```

Derived state belongs in selectors.

---

## 6. Debuggability

### DevTools Setup

Enable in dev only.

```typescript
StoreDevtoolsModule.instrument({
  maxAge: 25,
  logOnly: environment.production,
})
```

### Logging

Prefer effect-based logging.

```typescript
log$ = createEffect(() =>
  this.actions$.pipe(
    tap(action => console.log(action))
  ),
  { dispatch: false }
);
```

### Action Storms

If DevTools shows hundreds of actions per second:

- Over-orchestrated
- Bad subscriptions
- Leaking streams

Fix the source.

---

## 7. Complex Scenarios

### Integrations

Do not mirror service state.

Bad:

- Copy auth state into store
- Duplicate websocket buffers

Good:

- Listen to service events
- Dispatch actions
- Derive UI state

Example:

```typescript
authStatus$ = createEffect(() =>
  this.auth.status$.pipe(
    map(status =>
      AuthActions.statusChanged({ status })
    )
  )
);
```

---

### External Events

Example: SignalR

```typescript
signalR$ = createEffect(() =>
  this.signalR.messages$.pipe(
    map(msg =>
      FooActions.notificationReceived({ msg })
    )
  )
);
```

---

## 8. Unit Testing

Testing is covered in the Testing Guide.

Key principle:

- Reducers: pure unit tests
- Selectors: pure unit tests
- Effects: marble tests

Do not test NgRx itself.
Test your logic.

---

## 9. Appendix

### Recommended Reading

- NgRx Docs
- Redux Essentials
- RxJS Documentation
