# Architecture Guide for Angular Applications using NgRx

This document summarizes recommended architecture patterns and folder structures for Angular applications using NgRx and Signals. It covers high-level architectural principles, folder organization, component patterns, and routing strategies.

This document assumes a basic familiarity with Angular, NgRx, and Signals.

> For an introduction to NgRx and guidance on the best-practices as well as anti-patterns to avoid, see here: (TODO)

> For a detailed guide on the recommended testing approach, see here: (TODO)


## What is Codebase Architecture?

When we talk about codebase architecture, we're referring to the high-level organizational structure and design principles that govern how code is arranged, how components interact, and how the system evolves over time.

Key Aspects of Codebase Architecture

1. Structural Organization
Folder/file hierarchy - How code is physically organized (like your api/, features/, core/ structure)
Module boundaries - What belongs together and what should be separated
Dependency direction - Which parts can depend on which other parts

2. Interaction Patterns
Data flow - How information moves through the system (e.g., NgRx actions → effects → reducers)
Communication protocols - How different parts talk to each other
State management - Where and how application state is stored and updated

3. Design Principles & Constraints
Separation of concerns - Each piece has a clear, focused responsibility
Abstraction layers - What's hidden vs. exposed at different levels
Coupling & cohesion - How tightly components are connected vs. how focused they are internally


## **Common architecture approaches**

In terms of organising code, there are arguably three different approaches/options you'll see (quibbles aside like what folders are called, whether you have 'common' folder or a 'shared' folder etc.):

1. ❌ **Emergent architecture**
   Which is to say, no enforced structure, just whatever feels good at the time, path of least resistance  etc. In the best light this could be described as a 'domain-driven' folder structure, as developers will naturally tend to group code by business domain.
   The problem is, every big LOB application tends to have some object that the app is built to manage, e.g. a case, instruction, contract, project, plan etc. And so over time, you end up with a massive `case/` or `instruction/` folder with deep nesting.
   In any reasonably complex project - and really, if your project is simple you might as well use generative AI or low-code tools to build it - this approach tends to lead to confusion and difficulty finding things. It also makes it hard to reason about dependencies between features, as everything is tangled together. So prefer even an opinionated structure over this.

2. ❌ **BE inspired architecture**
   i.e. domain/ presentation/ services/ etc. breaks code down according to layers or concerns, similar to how backend applications are often structured. This makes a lot of sense on the backend where you have clear layers (controllers, services, repositories etc.) and where at a certain point of abstraction, data is data. It doesn't matter whether it's user data, order data, invoice data etc. endpoints all flow through the same layers and are processed similarly and the whole application is eventually compiled into a single deployable unit.
   On the frontend however, we have the concept of lazy-loaded feature modules, each with their own bundle/chunk. This means that features are more isolated from each other and (should) have clearer boundaries. There's also a lot more variation between features on the frontend. One might contain a map view with complex interactions, another might be a simple form, another containing a payments integration etc. Grouping code by layer/concern tends to obscure these differences and make it harder to navigate the codebase. It can also lead to large, monolithic layers that are hard to maintain and reason about. It also breaks the principle of cohesion, as code that changes together is often spread across multiple layers.

3. ❌ **Nested feature driven architecture**
   This is where you enforce a feature-based structure, but allow deep nesting within features. This allows for features within features. e.g. `case/` feature might have `case-details/`, `case-tasks/`, `case-history/` sub-features, each with their own store, views, components etc.
   The problem with this approach is that it can lead to very deep nesting, making it hard to find things. It can also lead to duplication of code if multiple features need similar functionality. And what happens when a sub-feature of feature A suddenly also has need to be a sub-feature of feature B? You'd need to move it up a level of course, but then you'd lose 'feature folder within feature A means dependent on A' assumption. Some of A's dependents might be sub-features within the `feature/feature-a` folder, others might be siblings of `feature-a` at the top level `features/` folder.

4. ✅ **Flat feature driven architecture**
    This is the approach recommended here. Each feature gets its own folder under `features/`. No sub-features within features. If a feature gets too big, consider splitting it into multiple features at the top level `features/` folder.
    
    This keeps things simple and predictable. You always know where to find a feature's code, and you avoid deep nesting. It also makes it easier to manage dependencies between features, as all features are at the same level.



## High level overview of an NgRx feature driven architecture

- **NgRx Store/Effects own orchestration**: async, side-effects, cross-feature dependencies, caching/idempotency.
- **Components own local UI state** via signals (as local as possible).
- **Signals are the default view contract**: components expose `readonly vm = computed(...)`.
- **ViewModels are pure mapping functions** (`mapToXxxVM`) and are heavily unit-tested.
- **Routing is fast**: route activates immediately; "entered" action fires; effects fetch; errors can redirect after the fact.

A big consideration in arriving at this architecture - and something that's often underappreciated as an architectural concern - is the question 'what will make PR reviews more effective and efficient?' Not just as a means of catching bugs, but as a way of sharing understanding and knowledge across the team. Many patterns that work well in the IDE become much harder to follow in a PR review, especially when the reviewer is not deeply familiar with the feature being changed.

If most PRs are being 'rubber-stamped' without deep review, that's a sign the architecture is too complex or too implicit; strive for clarity and explicitness even at the cost of some verbosity. Even among senior developers, there should always be room for meaningful discussion on non-trivial PRs.

## Recommended Folder Structure

The best place to start with understanding the architecture is in looking at the folder structure. This is, after all, the first thing a new developer will see when they open the codebase. Later on we'll dive into the specifics of feature modules and their structure, which is where the bulk of the application code will live.

The goals:

- Keep file hierarchy shallow and predictable (no more 'where is that file again?')
- Group code logically not semantically (i.e. code in `api/` relates to backend APIs, code in `core/` goes in initial bundle etc.)
- Ensure system is free from ambiguity, i.e. what's the difference between a 'core/' folder and 'common/' folder?


Top level structure (i.e. app/src/ contents):
```
@consts/
@types/
api/
core/
features/
shared/
```

Let's describe each of the above in turn:


### **@consts/**

What it says on the tin: application-wide constants, enums, literal types, etc.

May be fairly sparsely populated or contain all the constants for the app, depending on whether constants are centralized or collocated within the feature modules that use them.


### **@types/**

Type definitions and interfaces that are used throughout the application. Similar to @consts/, may be sparsely populated or contain many types depending on your approach to centralization vs collocation.

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


### **shared/**

Code that is shared across multiple features, such as utility functions, components, and services. Code in here should be written to be as general as possible for your org and avoid references to specific domain entities for the application at hand. It should be possible and reasonable to lift and shift code here into a shared package to be used in other applications within your org if needed.




### **features/**

The main application features, each in its own folder. This is where the bulk of the application code will live.


## **What is a feature?**

It's worth pinning down what the 'feature' in `/features` means here. The *feature* in `/features` refers to a unit of code organization that groups related functionality together; a feature *module*. A feature module doesn't necessarily equate to a a *product* feature as it might exist in the minds of the users or the business analysts. A feature in that sense will often require a lot of code, multiple screens, complex user flows. Often our job and value add as developers is to figure out how a product feature should be broken down into one or more feature modules.

Sometimes a feature module will neatly encapsulate all the code for a specific product feature, other times multiple feature *modules* will work together to implement a *product* feature or larger user journey or business capability. In general, all feature modules will be dependent on (free to import from) `core/`, `@consts/`, `api/`, `shared/` and `@types/` but feature modules should avoid depending on each other unless absolutely necessary.

When deciding where to draw the line, there are two semi-competing principles, the cohesion principle - stuff that changes together, should stay together - and the principle that each feature be kept small to aid in maintainability, re-useability, and to improve the value of the lazy-loading of bundles/chunks.

Cohesion suggests grouping code more tightly, while modularity suggests keeping features smaller and more numerous. There's no definitive right answer here, it's where judgement comes in. In general, strive for clarity and maintainability over rigid adherence to either principle.


> In high-velocity projects/teams or projects that have implemented continous delivery & deployment, lazy-loaded feature modules in tandem with run-time feature flags provide a valuable way to reduce risk of changes. You can duplicate an entire feature module, renaming the clone, and creating a 'v2' route (a lot like BE APIs will do) and redirect between the new and the old routes according to flag configuration. The result being that refactors or experimental features can be merged and then tested at a later time when QA capacity is available.


> We also break the cohesion principle by moving BE API/HTTP services out to `api/` and it would be a valid choice to move http services into the relevant feature module under `features/some-feature/services/some-feature.http.service.ts.` But in environments where FE and BE teams are often composed of different people with different specialties, separation of code according to collaboration boundaries gives us separation of concerns, more intuitive code reviews, and a simpler architecture that abstracts the bulk of the FE code from BE implementation details.

## Structure of a feature module

Example structure within `features/` with two example features (foo-feature and baz-feature):

```
features/

  // Simple feature, only one screen/view:

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

  // More complex feature, multiple screens/views:

  baz-feature/
    services/
      service-name.service.ts
      service-name.spec.ts
    utils/
      guard-name.guard.ts
      guard-name.spec.ts
      pipe-name.pipe.ts
      pipe-name.spec.ts
      helper-name.helpers.ts
      helper-name.spec.ts
    store/
      baz-feature.adapters.ts
      baz-feature.actions.ts
      baz-feature.effects.ts
      baz-feature.reducer.ts
      baz-feature.selectors.ts

    // Extend the domain model with UI only state if required (e.g. isSelected, isExpanded, etc.)
    // e.g. `export type BazItemVM = BazItem & { isSelected: boolean; isExpanded: boolean };`
    @types/
      baz.model.ts
    
    // Note: only one component, so we don't need a /baz-sidebar folder as no further nesting needed
    component/
      baz-sidebar.component.ts
      baz-sidebar.component.html
      baz-sidebar.component.css
      baz-sidebar.viewmodel.ts (optional, component may have inputs filled by values from parent screen vm)
      baz-sidebar.spec.ts

    // Note: more than one screen, so /view becomes /views, and additional nesting is required
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


## Managing dependencies between feature modules

The entry point for a feature module is typically a `routes.ts` file that defines the routes for the feature. This will be the case unless the feature is purely a library of components/services/utilities with no routes of its own.

In a more advanced scenario, the entry point could be an `index.ts` that exports public APIs of the feature module, with the option for additional tools that prevent importing from outside the `index.ts`. This is a good way of explicitly controlling what can be imported from where within your application but requires some additional setup and discipline.

Without an explicit export approach via `index.ts`, the assumption is that sub-optimal coupling through imports will be avoided by code reviews and developer discipline. This isn't as hard as it sounds; with clear action names, folder structures, and well-defined responsibilities for each piece of code, it's usually obvious when something is being imported from the wrong place or when something needs to be moved to `core/` or `shared/`.

In either case, the ideal state with feature modules is that they are as decoupled from each other as possible. A good litmus test is to delete a feature module folder entirely from the file system and see what breaks in the build. Ideally, the only breakages should be in an upstream `routes.ts` file(s) - possibly `app.routes.ts` - that were trying to lazy-load that feature.


## Lazy-loading Approach

Lazy-loading is a design pattern that allows you to load feature modules on demand, rather than at application startup. This can significantly improve the initial load time of your application, as only the necessary code is loaded upfront.

In Angular, lazy-loading is typically achieved using the Angular Router. By defining routes for your feature modules, you can instruct the router to load the module only when the user navigates to that route.

To implement lazy-loading, you need to follow these steps:

1. **Create a feature module**: Generate a new module for your feature using the Angular CLI.

2. **Define routes**: In the feature module, define the routes for the components that belong to that feature.

3. **Configure lazy-loading**: In the main application routing module, configure the router to load the feature module lazily using the `loadChildren` property.

4. **Optimize loading**: Use techniques like route preloading and code splitting to further optimize the loading of your feature modules.

To get the best of both worlds, i.e. fast initial load time and responsive navigation, it's recommended to combine lazy-loading with route preloading strategies. This way, while the initial load is kept minimal, other feature modules can be loaded in the background after the app has started, ensuring that when the user navigates to those features, they load quickly. This is done like so:

```ts
import { provideRouter, PreloadAllModules } from '@angular/router';
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(
      appRoutes,
      { preloadingStrategy: PreloadAllModules }
    ),
  ],
};
```

## Lazy-loading NgRx stores

Feature modules can have an NgRx store to handle state management; see the NgRx best practice guide if you need a primer. If they do, the store artifacts (actions, effects, reducer, selectors, adapters) should live in a `store/` folder within the feature module. e.g.

```
store/
  foo-feature.adapters.ts
  foo-feature.actions.ts
  foo-feature.effects.ts
  foo-feature.reducer.ts
  foo-feature.selectors.ts
```

There are two approaches to registering feature stores with the root.

#### ❌ Eager approach: register all features up-front

In this model, *all* feature reducers and effects are registered during application bootstrap via `app.config.ts`, regardless of whether the user ever navigates to those features.

```ts
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { fooFeature } from '@features/foo/store/foo.reducer';
import { FooEffects } from '@features/foo/store/foo.effects';

import { barFeature } from '@features/bar/store/bar.reducer';
import { BarEffects } from '@features/bar/store/bar.effects';

export const appConfig: ApplicationConfig = {
  providers: [
    provideStore({
      [fooFeature.name]: fooFeature.reducer,
      [barFeature.name]: barFeature.reducer,
    }),
    provideEffects(
      FooEffects,
      BarEffects,
    ),
  ],
};
```

#### ✅ Recommended approach: lazy-load feature stores

In a standalone-first, feature-driven architecture, the root application provides only the root store and root effects.
Each feature owns its NgRx wiring and registers it when its route is lazy-loaded.

```ts
// baz-feature/routes.ts
import { provideStoreFeature } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { bazFeature } from './store/baz.reducer';
import { BazEffects } from './store/baz.effects';

export const routes = [
  {
    path: '',
    component: BazComponent,
    providers: [
      provideStoreFeature(bazFeature.name, bazFeature.reducer),
      provideEffects(BazEffects),
    ],
  },
];
```

> Note: The lazy-loaded approach doesn't replace the root/core store. The root store can and should hold global state that is relevant across the entire application, such as authentication status, user profile, or application settings.

## Route Driven Data Fetching

For scalable SPAs, the current route should be the driving force in answering the question of "what data should be loaded where?"

> The exception being long-lived reference data from non-parameterized API routes in which case it's often simpler to handle in a service that fetches and caches the data on demand when observables or signals are subscribed to.

Routes are the most stable, explicit expression of user intent in a frontend application. A user navigates somewhere because they intend to view or interact with something. That makes the route the natural place to define data-loading policy:

- **What** data is required for this screen to be useful
- **When** it should be fetched or refreshed
- **How long** it should be retained
- **What happens on failure** (retry, show error, redirect, etc.)

This is not just an implementation detail — it is architecture.

If data loading policy is implicit (spread across lifecycle hooks, services, or child components), it becomes inconsistent, hard to reason about, and difficult to review. If it is route-driven and centralised in NgRx effects, it becomes explicit, testable, and easy to discuss in PR reviews.

There are three major motivations for this approach:

1. **Reducing unnecessary backend load**  
   Every unnecessary request we prevent lightens the load on our backend services. This doesn’t just save infrastructure cost — it improves response times across the board. Backend systems degrade non-linearly under load; reducing waste improves performance for everyone. Good frontend orchestration is therefore also a form of backend optimisation.

2. **Preserving user flow and responsiveness**  
   We should prioritise immediate UI feedback over strict data guarantees at route time. Users do not require data instantly; they require acknowledgement instantly.

3. **Simplifying mental models and code review**  
   When data loading is route-driven and centralised in effects, the mental model is clear: “What route are you on? That determines what data should be loaded.” This makes it easier for developers to reason about the code and for reviewers to verify that data isn’t being loaded unnecessarily or in the wrong places.

---

### ❌ The `ngOnInit` approach

The simplest and most common approach is to fetch data in `ngOnInit`, often using `shareReplay` to avoid duplicate requests.

This works in small applications, but it does not scale well.

- **Reload policy becomes accidental**  
  Navigating between `/foo` and `/foo/settings` might re-trigger `ngOnInit`, or might not, depending on component reuse. Developers then patch behaviour with caching operators or flags. Instead of expressing a clear policy, we get emergent behaviour.

- **Child pages become responsible for parent data**  
  If `/foo/settings` depends on data loaded by `/foo`, it cannot assume that data is present (users refresh, deep-link, or land directly). As a result, the child page must now also know how to load `/foo` data. Orchestration spreads across features and becomes duplicated.

- **Harder PR review**  
  When data loading is embedded in lifecycle hooks across multiple components and services, reviewers must mentally reconstruct the orchestration path. That increases cognitive load and makes subtle bugs easier to miss.

The net result is implicit policy, accidental reloads, and unnecessary backend calls.

---

### ✅ The route-driven NgRx approach

Instead, treat route entry as the primary trigger and let NgRx own orchestration.

A minimal pattern:

~~~ts
// features/foo-feature/routes.ts
export const routes = [
  {
    path: ':id',
    component: FooPageComponent,
    // Dispatch without blocking activation
    resolve: [() => inject(Store).dispatch(FooActions.entered())],
  },
];
~~~

This resolver does **not** await data. It simply dispatches an action. The route activates immediately, and the UI renders its loading or skeleton state while effects hydrate data in the background.

> See the UX rationale section below for why we intentionally do not block route activation until data is loaded.

This route driven approach creates a clear mental model:

> “What route are you on?”  
> → “That determines what data should be loaded.”

---

### NgRx effect orchestration

Once route entry dispatches an `entered()` action, all loading and refresh policy lives in effects.

The guiding principle is that orchestration belongs in effects, not components.

Below are some common patterns for effect orchestration:

#### Pattern 1: Always refresh on entry (simple and predictable)

~~~ts
@Injectable()
export class FooEffects {
  private readonly actions$ = inject(Actions);
  private readonly fooApi = inject(FooHttpService);

  loadOnEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FooActions.entered),
      exhaustMap(() =>
        this.fooApi.getFoo().pipe(
          map(foo => FooActions.loadFooSuccess({ foo })),
          catchError(error => of(FooActions.loadFooFailure({ error }))),
        ),
      ),
    ),
  );
}
~~~

This is often the best default. It is easy to understand, easy to test, and easy to review.

#### Pattern 2: Ensure-loaded + explicit refresh triggers

When you want snappy navigation without redundant calls:

~~~ts
@Injectable()
export class FooEffects {
  private readonly actions$ = inject(Actions);
  private readonly store = inject(Store);
  private readonly fooApi = inject(FooHttpService);

  ensureOnEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FooActions.entered),
      concatLatestFrom(() => this.store.select(FromFoo.selectFooLoaded)),
      filter(([, loaded]) => !loaded),
      exhaustMap(() =>
        this.fooApi.getFoo().pipe(
          map(foo => FooActions.loadFooSuccess({ foo })),
          catchError(error => of(FooActions.loadFooFailure({ error }))),
        ),
      ),
    ),
  );

  refreshAfterMutation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FooActions.updateFooSuccess),
      exhaustMap(() =>
        this.fooApi.getFoo().pipe(
          map(foo => FooActions.loadFooSuccess({ foo })),
          catchError(error => of(FooActions.loadFooFailure({ error }))),
        ),
      ),
    ),
  );
}
~~~

This makes reload policy explicit and reviewable:

- On route entry: ensure data exists
- After mutations: refresh deliberately

No lifecycle guesswork. No hidden coupling.

#### Pattern 3: Advanced orchestration with declarative abstraction

When a feature depends on upstream feature state (e.g. Baz depends on Foo), the orchestration logic can become verbose and difficult to read if written directly in RxJS.

In these cases, it can be valuable to encapsulate the common “wait / abort / fetch” pattern in a shared base class and expose a small, declarative API.


Example usage:

~~~ts
@Injectable()
export class BazFeatureEffects extends EffectFlowBase {
  private readonly bazHttpService = inject(BazHttpService);

  constructor(actions$: Actions, store: Store) {
    super(actions$, store);
  }

  loadBazData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(BazActions.entered, FooActions.loadFooDataSuccess),

      // Idempotency guard: don't refetch if Baz already loaded.
      this.skipIfLoaded(FromBaz.selectBazLoaded),

      exhaustMap(() =>
        this.then({
          // Wait until Foo data is fetched (!== undefined)
          waitFor: FromFoo.selectFoos,

          // Abort if Foo fails
          abortOn: FooActions.loadFooDataFailure,
          abortWith: BazActions.loadBazDataAbort,

          // Fetch Baz once prerequisites are available
          then: (foos) => this.bazHttpService.getBazData(foos),

          // Map results to actions
          onSuccess: (bazData) => BazActions.loadBazDataSuccess({ bazData }),
          onError: (error) => BazActions.loadBazDataFailure({ error }),
        }),
      ),
    ),
  );
}
~~~

With this approach, the effect reads as a short, linear narrative:

- Wait for upstream data to be available
- Abort if a failure occurs
- Fetch dependent data
- Map to success or error actions

This removes most RxJS ceremony from the call site and makes the intent immediately clear in PR reviews.

This pattern relies on a shared convention:

- `undefined` = not yet fetched
- `null` = fetched but failed
- any other value (including `[]`) = fetched successfully

By standardising on this convention, `waitFor` can safely distinguish between “still loading” and “ready”, without misinterpreting empty collections.

This 3rd pattern illustrates the power of declarative code combined with RxJs orchestration: we can express complex dependencies and policies in a way that is still readable, testable, and reviewable.


---

### UX rationale

This architecture is grounded in how humans actually perceive responsiveness.

Human–computer interaction research identifies three broad thresholds:

- Around **100 ms**: responses feel instantaneous and preserve a sense of direct control
- Around **1 second**: delays are noticeable but flow is usually maintained
- Around **10 seconds**: disengagement and context-switching become highly likely

These are best understood as upper bounds, not design targets.

In practice, flow often degrades much earlier — frequently after just **1–2 seconds**, especially for experienced users and knowledge workers. At that point, working memory begins to decay and users must mentally reconstruct context, which is cognitively expensive.

This is why even small, frequent delays can have a disproportionate impact on productivity: not because of the raw time lost, but because of the repeated disruption of attention and flow.

From this perspective, frontend architecture should prioritise **predictability and agency over strict data guarantees at route time**.

A three-second wait with immediate visual feedback (skeleton, spinner, layout rendered) is often perceived as more usable than a one-second freeze with no visible response.

> Aside: this is why async route resolvers and guards can be problematic when used for data hydration. They block route activation until data loads, delaying all feedback.  
> You might argue that the solution is simply to keep those API calls fast — but in practice, all APIs are slow sometimes. The 95th percentile latency of your endpoints is often worse than you think.

The practical goal should be:

> Every meaningful user action produces visible feedback quickly, even if full data hydration happens later.

---

### Security implications

You might wonder whether activating the route immediately has security implications — for example, an unauthorised user briefly loading the JS bundle for a protected page before being redirected on a `403`.

In practice, this does not meaningfully reduce security:

- Frontend code and routes are inherently discoverable by a motivated user
- A spinner or skeleton reveals no protected data — it only indicates navigation occurred

The security boundary must live on the backend:

- Always enforce authorisation on API requests
- Only return data the current user is allowed to access
- If the API responds with `403`, handle it in an effect and redirect to an access-denied (or other safe) page

Fast navigation and strong security are not in tension if the backend is correctly enforcing access control.



## Component Viewmodel Pattern

The final piece of the architecture puzzle is the Component Viewmodel Pattern, which is a design approach that aims to simplify the management of component state and data transformation in Angular applications. By leveraging Angular signals and NgRx's `selectSignal`, this pattern allows for a clear separation of concerns between the component's UI logic and the underlying state management.

A viewmodel is a data structure that represents the state of a UI component or screen in a way that is optimized for rendering. It typically contains all the data and state needed to render the UI, as well as any derived or computed values that are needed for display.

In the architecture recommended here, viewmodels are implemented using Angular signals and NgRx's `selectSignal` to derive state from the store. The viewmodel is exposed to the component template via a `readonly vm = computed(...)` property.

Let's look at some code to illustrate this pattern in practice...

### foo-sidebar.component.ts

Examine the code below for an imagined sidebar component and note how it's only concerned with 3 things:

- holding local UI state via signals
- exposing a `vm` signal to the template
- dispatching actions in response to user interactions (reporting user intents but not handling any logic around those intents)


```typescript
// features/foo/components/foo-sidebar/foo-sidebar.component.ts

import { FooActions } from '../store/foo.actions';

@Component({ /* ... */ })
export class FooSidebarComponent {
  private readonly store = inject(Store);
  
  // Local component state, think carefully and confirm that ONLY this component needs it.
  // i.e. a typeahead search text or an expanded/collapsed state.
  // Sometimes you might have 'UI' state that is nonetheless needed across mutliple components, in which
  // case best to extend the domain type in /feature/@types/foo.model.ts and manage it in the store.
  private readonly searchTextS = signal('');
  private readonly expandedS = signal(true);

  readonly vm = fooSidebarVM(this.store, this.searchTextS, this.expandedS);

  constructor() {
    effect(() => {
      // Example of a side effect that runs whenever the viewmodel changes.
      // Use sparingly.
      // Ask yourself if NgRx effects would be more appropriate.
      // In most cases you shouldn't need to do this.
      console.log('FooSidebarComponent VM changed:', this.vm());
    });
  }

  // UI intents
  setSearch(text: string) { 
    this.searchTextS.set(text); 
  }

  toggleExpanded() { 
    this.expandedS.update(v => !v); 
  }

  // Domain intents (store dispatch)
  textInputChange(text: string) {
    this.store.dispatch(FooActions.fooInputValueChange({ text }));
  }

  select(id: string) { 
    this.store.dispatch(FooActions.fooSelected({ id })); 
  }

  sendMessageToSelectedFoo() {
    this.store.dispatch(FooActions.sendMessageToSelectedFooButtonClick());
  }

}

```


### foo-sidebar.viewmodel.ts

This `*.viewmodel.ts` is where we define the view model and should always be found along side the `*.component.ts` for which it defines a view model for.

Let's start with the code and then break it down...


```typescript
// features/foo/components/foo-sidebar/foo-sidebar.viewmodel.ts

/**
  * ViewModel type definition.
 */
export type FooSidebarVM = {
  readonly showLoadingState: boolean;
  readonly showFooMessageInput: boolean;
  readonly fooMessageInputValue: string;
  readonly foosToDisplay: FooItemVM[];
  readonly showSendMessageButton: boolean;
  readonly disableSendMessageButton: boolean;
  readonly errorMessageToShow: string | null;
};


/**
 * mapToVM function. 
 * 
 * A pure mapping function that transforms raw state into the ViewModel.
 */
export function mapToFooSidebarVM(input: {
  permissions: string[];
  foos: Foo[] | undefined;
  inputText: string;
  selectedId: string | null;
  expanded: boolean;
  searchText: string;
}): FooSidebarVM {
  
  // It's often worth creating intermediate variables.
  // For complex conditions it will improve readability.
  const canSendMessage = input.permissions.includes('can_send_message');
  const hasFoos = !!input.foos?.length;

  return {
    showLoadingState: input.foos === undefined,
    showFooMessageInput: canSendMessage && hasFoos,
    fooMessageInputValue: input.inputText,
    foosToDisplay: (input.foos ?? []).map(foo => ({
      id: foo.id,
      name: foo.name,
      description: foo.description ?? '',
      status: foo.status,
      isSelected: foo.id === input.selectedId
    })).filter(foo => foo.name.toLowerCase().includes(input.searchText.toLowerCase())),
    showSendMessageButton: canSendMessage && hasFoos,
    disableSendMessageButton: !input.selectedId || input.inputText.trim() === '',
    errorMessageToShow: !hasFoos ? 'An error occurred.' : null
  };
}

/**
 * VM Store -> Signal function.
 */
export function fooSidebarVM(store: Store, searchText: Signal<string>, expanded: Signal<boolean>): Signal<FooSidebarVM> {

  // Domain state (from NgRx as signals)
  const permissions: Signal<string[]> = store.selectSignal(FromCore.selectPermissions);
  const foos: Signal<Foo[] | null | undefined> = store.selectSignal(FromFoo.selectFoos);
  const inputText: Signal<string> = store.selectSignal(FromFoo.selectFooInputText);
  const selectedId: Signal<string | null> = store.selectSignal(FromFoo.selectSelectedFooId);

  return computed(() => {
    return mapToFooSidebarVM({
      permissions: permissions(),
      foos: foos(),
      inputText: inputText(),
      selectedId: selectedId(),
      expanded: expanded(),
      searchText: searchText()
    });
  });
}

```

Every viewmodel file has three parts:

**1. ViewModel Type Definition**
Defines the contract between the view and the application. The key is making this contract readable from both sides - the component should know what to do with each property, and the viewmodel should clearly indicate its intent. Use as an opportunity to add clarity and intention.

Make sure a future developer is never asking:

- *From view-model.ts side:* "What will the component/view do with this data or flag?"

- *From component.ts side:* "What am I supposed to do with this data or flag?"

**2. Mapping Function (mapToVM)**
A pure function that transforms raw store data into the ViewModel. This is where you compute derived data and handle transformations.

> **Important**: Be careful with null reference errors - one mistake breaks the entire component. Use strict TypeScript settings, linting rules, and thorough unit testing. These mapping functions are ideal for unit testing and provide the highest ROI for test coverage.

**3. VM Signal Function**
Combines store data and local component state into a single reactive signal. This function is used inside the component and typically needs references to the store and local UI signals.


### Component hierarchy

Imagine the above sidebar component as a child of a `foo/view/foo-page.component.ts`. The same view model pattern would be used for the page component too which would have its own `foo-page.viewmodel.ts`. In fact, not every component needs a view model and it would be more likely that the child component uses signal inputs filled by properties from the parent component's view model.

> The  above begs the question: When *should* a child component of a page or screen have its own view model? Answer: when you want to break up the parent component's viewmodel into smaller pieces for readability and maintainability. This is because if the child component component doesn't have a view model then necessarily those input signals will need to be populated by properties from the parent component's viewmodel. If a large part of your `foo-page.viewmodel.ts` is concerned with populating fields for the `foo-sidebar.components.ts` then that might lead you to create a `foo-sidebar.viewmodel.ts` as below.


### Benefits of the Component ViewModel Pattern


The Component ViewModel Pattern offers several key benefits:

1. **Separation of Concerns**: By clearly delineating the responsibilities of views and state management, the pattern promotes a cleaner architecture. Views focus on presentation logic, reactivity and lifecycle events, while viewmodels handle data transformation and business logic.

2. **Testability**: Pure mapping functions are inherently testable. They can be unit tested in isolation, ensuring that the logic for transforming state into view-ready data is correct without the need for complex setup or dependencies.

3. **Clarity and Explicitness**: The viewmodel contract is explicit about what data is available to the view and how it should be used. This clarity helps prevent misunderstandings and makes it easier for developers to work with the code.

4. **Performance Benefits**: Using `computed()` to derive the viewmodel reactively allows for efficient updates. Only the parts of the view that depend on changed data are re-rendered, improving performance.

5. **PR Review Friendliness**: Clear, explicit transformations in the viewmodel are easy to follow and reason about during PR reviews. This transparency helps reviewers understand the intent behind changes and reduces the likelihood of introducing bugs.

## FAQs

### Where do services fit in?

In this guide, we've hardly mentioned services, but they still have an important role to play in the architecture.

It's just important when using them to ask whether NgRx might be a better fit for what you're trying to achieve. Don't fear creating an NgRx store just because it feels like a small amount of state at the time of writing - it's better to have a consistent and predictable codebase and not sweat the boilerplate; especially with generative AI tools, the boilerplate is less of a concern than it used to be.

If your service is managing state that needs to be shared across components, persisted, or coordinated with other features, then NgRx is likely the better choice. On the other hand, if you have complex logic that doesn't fit well in effects or selectors, or if you have a piece of functionality that is purely a utility and doesn't need to manage state, then a service can be a good place for that.

A telltale sign that you might want to use a service class is when you start passing state through sequences of actions so that chains of effects can do different things and the names of the effects start to become less clear.

The key is to keep services focused on a specific domain or area of functionality, and to avoid putting stateful logic in services where possible.

