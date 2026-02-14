## Action Naming (Best Practice)

Use a clear taxonomy:

### Page / Navigation Events
- `[Foo Page] Entered`
- `[Foo Parent Page] Entered`

### User Intents
- `[Foo Sidebar] Selected Foo`
- `[Foo Sidebar] Search Changed` (optional—often local signal instead)

### API Results
- `[Foo API] Load Foo Success`
- `[Foo API] Load Foo Failure`

### Commands
- `[Foo] Ensure Foo Loaded` (if you like explicit "ensure" actions)


## Effects (Named by Side-Effect, Idempotent, Dependency-Gated)

### Foo-Parent Actions

**foo-parent.actions.ts**

```typescript
export const FooParentPageActions = {
  entered: createAction('[Foo Parent Page] Entered'),
};

export const FooParentApiActions = {
  loadSuccess: createAction('[Foo Parent API] Load Success', props<{ data: FooParentData }>()),
  loadFailure: createAction('[Foo Parent API] Load Failure', props<{ error: unknown }>()),
};
```

### Foo-Parent Effect

**foo-parent.effects.ts**

```typescript
fetchFooParentData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(FooParentPageActions.entered),
    concatLatestFrom(() => this.store.select(FooParentSelectors.selectLoaded)),
    filter(([, loaded]) => !loaded),
    switchMap(() =>
      this.api.getFooParentData().pipe(
        map(data => FooParentApiActions.loadSuccess({ data })),
        catchError(error => of(FooParentApiActions.loadFailure({ error })))
      )
    )
  )
);
```

### Foo Actions

**foo.actions.ts**

```typescript
export const FooPageActions = {
  entered: createAction('[Foo Page] Entered', props<{ id: string }>()),
};

export const FooApiActions = {
  loadSuccess: createAction('[Foo API] Load Success', props<{ foo: Foo }>()),
  loadFailure: createAction('[Foo API] Load Failure', props<{ error: unknown }>()),
};

export const FooUiActions = {
  selected: createAction('[Foo Sidebar] Selected', props<{ id: string }>()),
};
```

### Foo Effect (Waits for Parent State Inside Effect, Does Not Block Route)

**foo.effects.ts**

```typescript
fetchFooData$ = createEffect(() =>
  this.actions$.pipe(
    ofType(FooPageActions.entered),
    switchMap(({ id }) =>
      this.store.select(FooParentSelectors.selectSomethingNeededByFoo).pipe(
        filter(Boolean),
        take(1),
        switchMap(parentThing =>
          this.api.getFoo({ id, parentThing }).pipe(
            map(foo => FooApiActions.loadSuccess({ foo })),
            catchError(error => of(FooApiActions.loadFailure({ error })))
          )
        )
      )
    )
  )
);
```
