# Architecture Summary (NgRx Best Practice + Signals)

## Principles

- **NgRx Store/Effects own orchestration**: async, side-effects, cross-feature dependencies, caching/idempotency.
- **Components own local UI state** via signals (as local as possible).
- **Signals are the default view contract**: components expose `readonly vm = computed(...)`.
- **ViewModels are pure mapping functions** (`mapToXxxVM`) and are heavily unit-tested.
- **Routing is fast**: route activates immediately; "entered" action fires; effects fetch; errors can redirect after the fact.

A big consideration in arriving at this architecture - and something that's often underappreciated as an architectural concern - is the question 'what will make PR reviews more effective and efficient?' Not just as a means of catching bugs, but as a way of sharing understanding and knowledge across the team. Many patterns that work well in the IDE become much harder to follow in a PR review, especially when the reviewer is not deeply familiar with the feature being changed.

If most PRs are being 'rubber-stamped' without deep review, that's a sign the architecture is too complex or too implicit; strive for clarity and explicitness even at the cost of some verbosity. Even among senior developers, there should always be room for meaningful discussion on non-trivial PRs.

## Recommended Folder Structure

The important part of the architecture is in organising the features, i.e. the bulk of the value adding code.

But we'll start from the top and look at a recommended top-level folder structure before diving into the feature structure.

The goal is to keep file hierarchy shallow and predictable while grouping code in a way that is meaningful but also free from ambiguity, i.e. what's the difference between a 'core/' folder and 'common/' folder, anyone?


Top level structure:
```
api/
core/
consts/
shared/
types/
features/
```

Let's describe each of the above in turn:

### **api/**

This is where we isolate all the code that forms the interface to backend services.

Put differently, it's the code that we can't change without collaborating with and informing backend teams/developers.

In terms of content, it's going to be the HTTP services and API models (DTOs) i.e. the domain as seen by the backend.

Expectation is the services in here are fairly thin wrappers around HttpClient, doing little more than constructing URLs, setting headers, and serializing/deserializing data. These services may extend a class from either core or a dependency to cover more complex use cases like retry logic, caching of reference data, etc. So long as it remains straightforward.

Structure inside `api/` can vary but generally I'm a fan of trying to mirror the BE API structure where possible, so if the BE has a couple of big routes, say `/banking-app-users`, `/banking-app-reference` and `banking-app-admin`, then I might expect to see inside `api/` something like:

```
api/
  /banking-app-users/
    banking-app-users.http.service.ts
    banking-app-users.domain.model.ts
  /banking-app-reference/
    banking-app-reference.http.service.ts
    banking-app-reference.domain.model.ts
  /banking-app-admin/
    banking-app-admin.http.service.ts
    banking-app-admin.domain.model.ts
```

Example Http Service:
```typescript
export class BankingAppUsersHttpService extends AbstractHttpCachingService {

  constructor(private readonly http: HttpClient) {
    super();
  }

  getUsers(): Observable<BankingAppUserDTO[]> {
    return this.http.get<BankingAppUserDTO[]>('/api/banking-app-users');
  }

  postUserUpdate(userId: string, update: BankingAppUserUpdateDTO): Observable<void> {
    return this.http.post<void>(`/api/banking-app-users/${userId}`, update);
  }

  /*
    Example of a reference-data endpoint that we want to cache for a session.
    The logic here is dependant on AbstractHttpCachingService implementation, the code for which will
    likely live in core/ or a shared dependency.
  */
  getExampleReferenceData(): Signal<ExampleReferenceDTO> {
    return this.createCachedSignal<ExampleReferenceDTO>({
      cacheKey: '/api/banking-app-users/example-reference',
      observableFactory: () => this.http.get<ExampleReferenceDTO>('/api/banking-app-users/example-reference')
    });
  }

  // other methods...
}
```

Once there are enough routes/endpoints under a given area it can make sense to further subdivide, e.g. `api/banking-app-users/permissions/`, `api/banking-app-users/roles/` etc. but don't overdo it; keep things as flat as possible while still being navigable.

### **core/**

Think of this as the kernel of your application. We generally want to lazy-load our feature-modules, which means seeing them as separate bundles whereas core/ should be seen as part of the main/initial bundle.

So only put code here that is either essential for bootstrapping the app or is very widely used, think 'meta-features' like feature-flagging, logging, error handling, auth, etc.

Or generic screens for handling app-level concerns like maintenance mode, global error display, 404 page etc.


### **consts/**

What it says on the tin: application-wide constants, enums, literal types, etc.

May be fairly sparsely populated or contain all the constants for the app, depending on whether constants are centralized or collocated within the feature modules that use them.


### **shared/**

Code that is shared across multiple features, such as utility functions, components, and services.


### **types/**

Type definitions and interfaces that are used throughout the application. Similar to consts/, may be sparsely populated or contain many types depending on your approach to centralization vs collocation.


### **features/**


The main application features, each in its own folder. This is where the bulk of the application code will live.


#### **What is a feature?**

It's worth pinning down what 'feature' means here. A feature doesn't necessarily equate to a a whole 'feature' of the application as it might exist in the minds of users or business analysts. A feature in that sense will often require a lot of code, multiple screens, complex state management etc.

Think of a feature in this architecture as a unit of code organization that groups related functionality together. Multiple features may together implement a proper 'feature' or larger user journey or business capability.

When it comes to organizing business features into code features, there are two semi-competing instincts, Cohesion - stuff that changes together, should stay together - and the goal that each feature be kept small to aid in maintainability and improve the value of the lazy-loading of bundles/chunks.

> In high-velocity projects/teams or projects that have implemented continous delivery/deployment practices, lazy-loaded feature modules provide a valuable way to reduce risk of a refactor. You can start by duplicating an entire feature module, renaming the clone, and creating a 'v2' route and redirecting between the new and the old routes via runtime feature flags. The result being that refactors or experimental features can be merged and then tested at a later time when QA capacity is available.

Cohesion suggests grouping code more tightly, while the goal of lazy-loading suggests keeping features smaller and more numerous.

> We also break cohesion by moving BE API/HTTP services out to `api/` and it would be a valid choice to move http services into a feature module under `features/some-feature/services/` but in environments where FE and BE teams are often composed of different people/teams, cordoning off all BE API interaction into `api/` makes collaboration and ownership clearer IMO.

There's no definitive right answer here, it's where judgement comes in. In general, strive for clarity and maintainability over rigid adherence to either principle.


#### **Architecture approaches (compare and contrast)**

In terms of organising code, there are arguably three different approaches/options you'll see (quibles aside like what folders are called, whether you have 'common' folder or a 'shared' folder etc.):

1. **Emergent architecture**
   Which is to say, no enforced structure, just whatever feels good at the time, path of least resistance. In the best light this could be described as a 'domain-driven' folder structure, as developers will naturally tend to group code by business domain.
   The problem is, every big LOB application tends to have some object that the app is built to manage, e.g. a case, instruction, contract, project, plan etc. And so over time, you end up with a massive `case/` or `instruction/` folder with deep nesting.

2. **Nested feature driven architecture**
   This is where you enforce a feature-based structure, but allow deep nesting within features. This allows for features within features. e.g. `case/` feature might have `case-details/`, `case-tasks/`, `case-history/` sub-features, each with their own store, views, components etc.
   The problem with this approach is that it can lead to very deep nesting, making it hard to find things. It can also lead to duplication of code if multiple features need similar functionality. And what happens when a sub-feature of feature A suddenly also has need to be a sub-feature of feature B? You'd need to move it up a level of course, but then you'd lose 'feature folder within feature A means dependent on A' assumption. Some of A's dependents might be sub-features within the `feature/feature-a` folder, others might be siblings of `feature-a` at the top level `features/` folder.

3. **Flat feature driven architecture**
    This is the approach recommended here. Each feature gets its own folder under `features/`. No sub-features within features. If a feature gets too big, consider splitting it into multiple features at the top level `features/` folder.
    
    This keeps things simple and predictable. You always know where to find a feature's code, and you avoid deep nesting. It also makes it easier to manage dependencies between features, as all features are at the same level.



Example structure within `features/`:

```
features/

  // Simple feature, only one screen/view

  foo-feature/
    store/
      foo-feature.actions.ts
      foo-feature.effects.ts
      foo-feature.reducer.ts
      foo-feature.selectors.ts
    view/
      foo-feature-screen.component.ts
      foo-feature-screen.component.html
      foo-feature-screen.component.css
      foo-feature-screen.viewmodel.ts
      foo-feature-screen.spec.ts
    routes.ts

  // More complex feature, multiple screens/views, note /view becomes /views

  baz-feature/
    services/
      baz-feature.service.ts
      baz-feature.service.spec.ts
    utils/
      baz.guard.ts
      baz.pipe.ts
      baz.helpers.ts
      baz-helpers.spec.ts
    store/
      baz-feature.actions.ts
      baz-feature.effects.ts
      baz-feature.reducer.ts
      baz-feature.selectors.ts
    components/
      baz-sidebar/
        baz-sidebar.component.ts
        baz-sidebar.component.html
        baz-sidebar.component.css
        baz-sidebar.viewmodel.ts
        baz-sidebar.spec.ts
    views/
      baz-screen-one/
        baz-screen-one.component.ts
        baz-screen-one.component.html
        baz-screen-one.component.css
        baz-screen-one.viewmodel.ts
        baz-screen-one.spec.ts
      baz-screen-two/
        baz-screen-two.component.ts
        baz-screen-two.component.html
        baz-screen-two.component.css
        baz-screen-two.viewmodel.ts
        baz-screen-two.spec.ts

```
### Notes — implementation guidance

- NgRx placement
  - Keep all feature store artifacts in a `store/` folder inside the feature: `actions`, `effects`, `reducer`, `selectors`.
  - Name files consistently (e.g. `foo.actions.ts`, `foo.effects.ts`, `foo.reducer.ts`, `foo.selectors.ts`) so reviewers instantly know where to look.
  - Shared/global state can live in `core/store` or a top-level `store/` if truly cross-cutting.

- VM mappers (placement & shape)
  - Place VM mappers next to the view they serve (e.g. `foo-page.viewmodel.ts` or `foo-sidebar.viewmodel.ts`).
  - Define VMs as **types** (e.g. `FooPageVM`, `FooSidebarVM`) since they're pure data containers.
  - Use `readonly` properties to emphasize immutability.
  - Export a single pure function like `mapToFooPageVM(input): FooPageVM`. No DI, no side-effects, deterministic outputs, safe defaults.
  - Unit-test these mappers thoroughly — they are the highest-ROI tests.

- Component-local UI state
  - Keep UI-only state local to the component using signals (`signal`, `computed`). Expose a `readonly vm = computed(...)` to the template.
  - If multiple sibling components share ephemeral UI state, consider a small colocated signal/service; only elevate to NgRx when state needs global coordination, persistence, or cross-feature consumption.

- Component + ViewModel pattern
  - Components handle UI state via signals and delegate domain state to NgRx via `selectSignal`.
  - Pure ViewModel mapper functions transform raw state into display-ready data structures.
  - This approach keeps components focused on UI concerns while making business logic easily testable.

- Testing & review ergonomics
  - Prioritise: VM mapper tests > effects tests > light component tests.
  - Keep action names and folder layout explicit — this pays back in faster, more reliable PR reviews.

These rules aim for predictability: small, colocated pieces with clear responsibilities make code easier to read, review, and refactor.



## Routing Pattern (Dispatch Actions on Enter, No Blocking)

Facilitating UX flow over strict data guarantees at route time.

Routes activate immediately, actions dispatched to load data, effects handle fetching and errors.

Views/screens should handle loading/error states gracefully.

This ensures that for the 99% of situations where users do have permission to access the page they are navigating to, the experience is fast and fluid with the application responding immediately to user input.

See below for example of routes.ts with two imagined features `foo-feature` and `baz-feature` - with `baz-feature` having a dependency on `foo-feature`.


```typescript
// features/foo-feature/routes.ts

export const routes = [
  {
    path: 'foo-feature',
    resolve: [() => inject(Store).dispatch(FooFeatureActions.entered())],
    children: [
      {
        path: 'baz-feature',
        loadChildren: () => import('../baz-feature/routes').then(m => m.routes),
      },
      // ...
    ],
  },
];
```


```typescript
// features/baz-feature/routes.ts

export const routes = [
  {
    path: ':id',
    component: BazPageComponent,
    resolve: [() => inject(Store).dispatch(BazActions.entered())],
  },
];
```

> These are "enter hooks", not data resolvers; effect idempotency makes this safe.

TODO: More context / explanation around this pattern.


## Component Pattern (Signals + NgRx selectSignal + Pure VM Mapping)

### foo-sidebar.component.ts

```typescript
@Component({ /* ... */ })
export class FooSidebarComponent {
  private readonly store = inject(Store);

  // Domain state (from NgRx as signals)
  private readonly foosS = this.store.selectSignal(selectFoos);
  private readonly selectedIdS = this.store.selectSignal(selectSelectedFooId);

  // Local UI-only state (signals)
  private readonly searchTextS = signal('');
  private readonly expandedS = signal(true);

  // View contract for template
  readonly vm = computed(() =>
    mapToFooSidebarVM({
      foos: this.foosS(),
      selectedId: this.selectedIdS(),
      searchText: this.searchTextS(),
      expanded: this.expandedS(),
    })
  );

  // UI intents
  setSearch(text: string) { this.searchTextS.set(text); }
  toggleExpanded() { this.expandedS.update(v => !v); }

  // Domain intents (dispatch)
  select(id: string) { this.store.dispatch(FooUiActions.selected({ id })); }
}
```

### foo-sidebar.viewmodel.ts (Pure)

```typescript
export type FooSidebarVM = {
  readonly items: readonly FooItem[];
  readonly selectedId: string | null;
  readonly isExpanded: boolean;
  readonly filteredItems: readonly FooItem[];
  readonly hasResults: boolean;
};

export function mapToFooSidebarVM(input: {
  foos: Foo[];
  selectedId: string | null;
  expanded: boolean;
  searchText: string;
}): FooSidebarVM {
  // pure mapping; safe defaults; never throw
  const filteredItems = input.foos.filter(foo => 
    foo.name.toLowerCase().includes(input.searchText.toLowerCase())
  );
  
  return {
    items: input.foos,
    selectedId: input.selectedId,
    isExpanded: input.expanded,
    filteredItems,
    hasResults: filteredItems.length > 0,
  };
}
```

#### **Viewmodel Approaches (Compare and Contrast)**

When it comes to handling viewmodels and component state management, there are several approaches you might encounter:

1. **Pure Mapper Functions (Recommended)**
   - ViewModels are defined as `type` definitions with readonly properties
   - Pure mapping functions (`mapToFooVM`) transform raw state to display-ready data
   - Components use `computed()` to call these mappers reactively
   - **Pros**: Simple, testable, no dependencies, clear separation of concerns
   - **Cons**: Components directly depend on NgRx store

2. **Facade/Service Pattern**
   - Introduces a service layer that encapsulates store interactions and exposes observables/signals
   - Components depend on the facade instead of directly on NgRx
   - **Pros**: Decouples components from NgRx, easier to swap state management libraries
   - **Cons**: Additional abstraction layer, more boilerplate, potential for over-engineering

3. **Presenter Pattern**
   - Components delegate all logic to presenter classes that handle both UI state and domain interactions
   - Presenters often have lifecycle methods and maintain state
   - **Pros**: Very clean separation, testable business logic
   - **Cons**: More complex, harder to follow in PR reviews, can lead to over-abstraction

**Why Pure Mapper Functions Win:**

The pure mapper approach strikes the right balance for most applications:
- **Simplicity**: Minimal cognitive overhead, easy to understand
- **Testability**: Pure functions are trivial to unit test
- **Performance**: `computed()` provides efficient reactivity
- **PR Review Friendly**: Clear, explicit transformations are easy to review
- **Pragmatic**: Embraces the reality that moving away from NgRx is unlikely, and if it happens, modern tooling (including AI) can handle refactoring

The facade pattern addresses a theoretical concern (NgRx lock-in) that rarely materializes in practice, while adding real complexity that impacts day-to-day development.



# TODO: MOVE NgRx Best Practice to separate doc

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

> Optionally add idempotency checks against `selectFooLoadedById(id)` too.

# TODO: Move/fold testing approach into separate document

## Testing Approach (Best Practice)

### VM Tests (Highest ROI)
- Unit test `mapToFooSidebarVM` / `mapToFooPageVM` as pure functions.

### Effects Tests

**fetchFooParentData$:**
- when entered and not loaded → calls API → success/failure actions

**fetchFooData$:**
- when `[Foo Page] Entered` but parent data missing → waits
- once parent data present → calls API → success/failure

### Component Tests (Optional)
- Typically light: template wiring and event handlers.
- Don't re-test VM logic already covered by mapper tests.

---



