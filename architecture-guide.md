# Architecture Guide for Enterprise Angular Applications using NgRx

This is one of three documents that together provide a comprehensive guide to building Angular applications with NgRx and Signals:

> **Architecture Guide** (this document) - which describes a declarative architecture for Angular applications using NgRx and Signals. It covers high-level architectural principles, folder organization, component patterns, orchestration and routing strategy.

> [NgRx Best Practice Guide](https://github.com/frabrooks/angular-architecture-guide/blob/main/ngrx-best-practice.md) - which introduces NgRx and outlines best practices to aim for and anti-patterns to avoid. You may want to start with this one if you're new to NgRx.

> [Testing Approach Guide](TODO) - which describes how to approach testing in an Angular + NgRx codebase, including patterns for testing components, services, and NgRx artifacts.

---

## Table of Contents

**Preamble**

1. [What is Codebase Architecture?](#what-is-codebase-architecture)
2. [Common Architecture Approaches](#common-architecture-approaches)

**Architecture Guide**

3. [Architecture Overview](#architecture-overview)
4. [How to organise the root folder](#how-to-organise-the-root-folder)
5. [What is a feature module?](#what-is-a-feature-module)
6. [How to organise a feature module](#how-to-organise-a-feature-module)
7. [Managing dependencies between feature modules](#managing-dependencies-between-feature-modules)
8. [Lazy-loading Approach](#lazy-loading-approach)
9. [Declarative Route-Driven Orchestration](#declarative-route-driven-orchestration)
10. [Component ViewModel Pattern](#component-viewmodel-pattern)
11. [Not covered in this document](#not-covered-in-this-document)
12. [Code Appendix](#code-appendix)


---

[Back to top](#table-of-contents)

## What is Codebase Architecture?

When we talk about codebase architecture, we're referring to the high-level organizational structure and design principles that govern how code is arranged, how components interact, and how the system evolves over time.

The key aspects of codebase architecture are:

1. **Structural Organization:**
    - Folder/file hierarchy — How code is physically organized (like your `api/`, `features/`, `core/` structure)
    - Module boundaries — What belongs together and what should be separated
    - Dependency direction — Which parts can depend on which other parts

2. **Interaction Patterns:**
    - Data flow — How information moves through the system (e.g., NgRx actions → effects → reducers)
    - Communication protocols — How different parts talk to each other
    - State management — Where and how application state is stored and updated

3. **Design Principles & Constraints:**
    - Separation of concerns — Each piece has a clear, focused responsibility
    - Abstraction layers — What's hidden vs. exposed at different levels
    - Coupling & cohesion — How tightly components are connected vs. how focused they are internally


### **Goals of a Good Codebase Architecture**

A good codebase architecture should aim to achieve the following goals:

1. **Scalability**: The architecture should support growth in both codebase size and team size without becoming unmanageable.

2. **Maintainability**: It should be easy to understand, modify, and extend the codebase over time, even for developers who are new to the project.

3. **Testability**: The structure should facilitate writing and running tests, making it easier to ensure code quality and catch bugs early.

4. **Performance**: The architecture should allow for efficient loading and execution of code, optimizing for user experience.

5. **Developer Experience**: The architecture should make it easy for developers to navigate the codebase, understand how different parts interact, and contribute effectively.

6. **Readability & PR Review Friendliness**: The architecture should promote clear, explicit code that is easy to follow and reason about during PR reviews and that facilitates knowledge sharing.

That last point is even more important in a world where generative AI is acting as an accelerant for code changes, moving the value we add as developers away from writing code manually and towards overseeing, reviewing, and guiding code changes.

If most PRs are being 'rubber-stamped' without deep review, that's a sign the architecture is too complex, too imperative, or too implicit; strive for clarity and explicitness even at the cost of some verbosity.

---

[Back to top](#table-of-contents)

## **Common Architecture Approaches**

There are arguably four main architectural approaches you’ll see in the wild, with endless variations.

### 1. ❌ **Emergent architecture**

This is the “no enforced structure” approach: whatever feels convenient at the time, following the path of least resistance.

In the best light, this can be described as an informal, domain-driven structure, where developers naturally group code by business concept.

In practice, every large line-of-business application tends to revolve around one or two dominant entities — for example: cases, instructions, contracts, projects, or plans. Over time, this leads to massive folders such as `case/` or `instruction/` with deep, inconsistent nesting.

In any reasonably complex project, this approach tends to produce:

- Confusion about where things live
- Increasing difficulty navigating the codebase
- Tightly tangled dependencies between features

Because there is no explicit structure, architecture emerges accidentally rather than deliberately. Even a mildly opinionated structure is usually preferable to this.


### 2. ❌ **Layered (type-based) architecture**

This approach groups code by technical role or “layer”, for example:

- `pages/`
- `components/`
- `routes/`
- `services/`
- `hooks/`
- `validators/`

(or on the backend: `controllers/`, `services/`, `repositories/`, etc.)

This is sometimes called *horizontal slicing*: each layer spans the entire application.

On the backend, this structure often makes sense. Most backend systems are compiled into a single deployable unit, with well-defined processing stages. At a certain level of abstraction, data is just data: user records, orders, and invoices all flow through the same controller → service → repository pipeline.

On the frontend, however, the constraints are fundamentally different.

Modern Angular applications are split into multiple independently loaded bundles via lazy-loaded feature modules. Each feature has its own lifecycle, performance profile, and interaction patterns. A map-heavy dashboard, a payment flow, and a simple CRUD screen are not variations of the same pipeline — they are qualitatively different pieces of software that happen to live in the same application.

When code is grouped primarily by technical layer:

- Feature boundaries become implicit and blurred  
  Understanding “how feature X works” requires jumping between many folders.

- Related code is physically scattered  
  Code that changes together is spread across multiple layers.

- Lazy-loading boundaries are obscured  
  It becomes harder to see which files belong to which bundle.

- Navigation and onboarding suffer  
  Developers must understand the entire layering scheme before they can reason about a single feature.

- Refactoring and reuse become harder  
  Extracting, duplicating, or versioning a feature requires touching many unrelated folders.

The net effect is reduced cohesion: features become thin slices spread across the entire codebase.

This style often feels clean early in a project, but as complexity grows it tends to produce large, monolithic layers that are difficult to reason about and expensive to evolve.


### 3. ❌ **Nested feature-driven architecture**

This approach enforces a feature-based structure, but allows deep nesting within features.

For example, a `case/` feature might contain:

- `case-details/`
- `case-tasks/`
- `case-history/`

each with their own store, views, and components.

While this initially feels like a good compromise, it introduces new problems:

- Deep nesting makes navigation slow and error-prone
- Similar functionality is often duplicated across sub-features
- Cross-feature reuse becomes awkward

A common failure mode appears when a sub-feature of feature A later needs to be reused by feature B. It must be moved “up” the hierarchy, breaking assumptions about dependency direction and ownership.

Over time, the folder structure stops reflecting true relationships between features and becomes a historical accident.

### 4. ✅ **Flat feature-driven architecture (recommended)**

This is the approach recommended in this guide.

Each feature lives in its own top-level folder under `features/`. Features do not contain sub-features.

If a feature grows too large, it should be split into multiple top-level features instead.

Example:

```
features/
  foo-feature/
  bar-feature/
  baz-feature/
```

This structure keeps the hierarchy shallow, predictable, and easy to navigate.

#### Why vertical slicing works better

This approach is sometimes called *vertical slicing*: each feature contains everything it needs — routes, components, store, services, and utilities — in one place.

This aligns naturally with how modern frontend applications are built and deployed:

- Each feature maps cleanly to a lazy-loaded bundle
- Ownership and responsibility are explicit
- Performance boundaries are visible in the file system
- Code that changes together lives together
- Features can be reasoned about, tested, and reviewed in isolation

In practice, this leads to:

- Faster onboarding
- Clearer PR reviews
- Safer refactors
- More predictable performance
- Lower long-term maintenance cost

It optimises the codebase for how teams actually work: around features, user journeys, and business capabilities — not around technical layers.

This is why flat, feature-driven architecture is the foundation of the patterns described in the rest of this guide.

---

[Back to top](#table-of-contents)

## Architecture Overview

This architecture is built around two pillars of equal importance:

1. **Declarative route-driven NgRx orchestration**  
2. **ViewModels as the contract between state and UI**


### 1) Declarative route-driven NgRx orchestration

Routes are the most stable expression of user intent. When the user navigates, we treat that as an explicit policy trigger:

- A route hook dispatches a single `entered` (or `routeEntered`) action with typed params.
- Effects own *all* orchestration: fetching, ensuring loaded, refresh triggers, dependency coordination, and failure handling.
- We avoid blocking route activation on API calls; the UI renders immediately and hydrates in the background.


### 2) ViewModels as the view contract

The second half of the architecture is how screens and components *consume* state.

We treat ViewModels as the explicit contract between the application and the template:

- Components expose **one primary template API**: `readonly vm = computed(...)`
- ViewModels are built from **signals** (store selectors via `selectSignal` + local UI signals)
- ViewModels use **pure mapping functions** (`mapToXxxVM`) to transform raw state into render-ready state

This gives you code that is easy to reason about and easy to review:

- Templates become dumb: they bind to `vm()`
- Components become thin: local UI signals + dispatching intents
- Complexity is centralized and testable: mapping logic lives in pure functions


---

[Back to top](#table-of-contents)

## How to organise the root folder

The best place to start with understanding the architecture is in looking at the folder structure. This is, after all, the first thing a new developer will see when they open the codebase.

The goals:

- Keep file hierarchy shallow and predictable (no more '*where is that file again?*')
- Group code logically and vertically, not semantically and horizontally
- Ensure system is free from ambiguity


Top-level structure (i.e. app/src/ contents):
```
api/
consts/
core/
features/
shared/
types/
```

Let's describe each of the above in turn:


### **consts/**

What it says on the tin: application-wide constants, enums, literal types, etc.

May be fairly sparsely populated or contain all the constants for the app, depending on whether constants are centralized or collocated within the feature modules that use them.


### **types/**

Type definitions and interfaces that are used throughout the application. Similar to `consts/`, may be sparsely populated or contain many types depending on your approach to centralization vs collocation.

Use `types/` to hold shared types and interfaces that describe your domain model and any widely-used UI variants. There are two common uses:

- Root-level types/  
  Store application-wide DTOs, enums and types that are referenced by many features (e.g. API models, cross-cutting domain interfaces). Keep these types stable and minimal — they should represent the domain as the backend sees it.

- Feature-local types/ (inside a feature folder)  
  Extend or augment root/domain types with UI-specific properties that are local to that feature. These extensions make it clear which properties are purely UI concerns (selection, expansion, transient flags) and keep domain models clean.

E.g.

```typescript
// features/foo/types/foo.model.ts
import { Foo } from '@api/foo/foo.domain.model';

// UI-specific ViewModel for the feature (collocated with the feature)
export type FooVM = Foo & {
  isExpanded: boolean;
  isSelected: boolean;
};
```

Guidelines:
- Prefer collocating UI-only extensions inside the feature so other features don’t accidentally depend on UI concerns.
- Name files clearly (e.g. foo.model.ts, foo.types.ts) and export small, focused types.
- Keep domain DTOs (root `/types`) free from UI flags; use feature `/types` for ViewModel shapes and derived UI state.


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

  postUserUpdate(userId: string, update: UserUpdateDTO): Observable<void> {
    return this.http.post<void>(`/api/banking-app-users/${userId}`, update);
  }

  /*
    Example of a cached reference-data endpoint.
    Dependent on AbstractHttpCachingService implementation,
    the code for which will likely live in core/
  */
  getExampleReferenceData(): Signal<ExampleReferenceDTO> {
    return this.createCachedSignal<ExampleReferenceDTO>({
      cacheKey: '/api/banking-app-users/example-reference',
      observableFactory: () => this.http.get<ExampleReferenceDTO>(
        '/api/banking-app-users/example-reference'
        )
    });
  }

  // other methods...
}
```

Once there are enough routes/endpoints under a given area it can make sense to further subdivide, e.g. `api/banking-app-users/permissions/`, `api/banking-app-users/roles/` etc. but don't overdo it; keep things as flat as possible while still being navigable.

### **core/**

Think of this as the kernel of your application. We generally want to lazy-load our feature modules, which means seeing them as separate bundles whereas core/ should be seen as part of the main/initial bundle.

So only put code here that is either essential for bootstrapping the app or is very widely used, think 'meta-features' like feature-flagging, logging, error handling, auth, etc.

Generic screens for application-level concerns like maintenance mode, global error display, 404 page etc.


### **shared/**

Code that is shared across multiple features, such as utility functions, components, and services. Code in here should be written to be as general as possible for your org and avoid references to specific domain entities for the application at hand. It should be possible and reasonable to lift and shift code here into a shared package to be used in other applications within your org if needed.


### **features/**

The main application features, each in its own folder. This is where the bulk of the application code will live. We'll explore this in more detail in the next section.

---

[Back to top](#table-of-contents)

## **What is a feature module?**

It's worth pinning down what the 'feature' in `/features` means here. The *feature* in `/features` refers to a unit of code organization that groups related functionality together; a feature *module*. A feature module doesn't necessarily equate to a *product* feature as it might exist in the minds of the users or the business analysts. A feature in that sense will often require a lot of code, multiple screens, complex user flows. Often our job and value add as developers is to figure out how a product feature should be broken down into one or more feature modules.

Sometimes a feature module will neatly encapsulate all the code for a specific product feature, other times multiple feature *modules* will work together to implement a *product* feature or larger user journey or business capability. In general, all feature modules will be dependent on (free to import from) `core/`, `consts/`, `api/`, `shared/` and `types/` but feature modules should avoid depending on each other unless absolutely necessary.

When deciding where to draw the line, there are two semi-competing principles, the cohesion principle - stuff that changes together, should stay together - and the principle that each feature be kept small to aid in maintainability, reusability, and to improve the value of the lazy-loading of bundles/chunks.

Cohesion suggests grouping code more tightly, while modularity suggests keeping features smaller and more numerous. There's no definitive right answer here, it's where judgement comes in. In general, strive for clarity and maintainability over rigid adherence to either principle.


> In teams aiming at rapid iteration, or in projects with continuous delivery and deployment, lazy-loaded feature modules combined with runtime feature flags provide a powerful way to reduce change risk.
Entire feature modules can be duplicated and evolved in parallel, for example by creating a “v2” route (similar to versioned backend APIs) and switching between versions via configuration.
This allows large refactors or experimental features to be merged safely and enabled later, when testing and QA capacity is available, rather than blocking delivery.

---

[Back to top](#table-of-contents)


## How to organise a feature module

Example structure within `features/` with two example features (foo-feature and baz-feature):

```
features/

  // Simple feature w/ only one screen:

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

  // More complex feature w/ multiple screens:

  baz-feature/
    // Extend the domain model with UI only state if required (e.g. isSelected, isExpanded, etc.)
    types/
      baz.model.ts
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
    component/
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


> **Plural vs singular folders:** To keep the left-nav as shallow as possible, use `view/` or `/component` when the feature has **exactly one** routed view or component; and use `views/` or `/components/` when it has **multiple** routed views or components. In the single view case, the component files can live directly under `view/` or `component/` without an additional folder. In the multiple view case, each view gets its own folder under `views/` or `components/`.

---

[Back to top](#table-of-contents)

## Managing dependencies between feature modules

The entry point for a feature module is typically a `routes.ts` file that defines the routes for the feature. This will be the case unless the feature is purely a library of components/services/utilities with no routes of its own.

In a more advanced scenario, the entry point could be an `index.ts` that exports public APIs of the feature module, with the option for additional tools that prevent importing from outside the `index.ts`. This is a good way of explicitly controlling what can be imported from where within your application but requires some additional setup and discipline.

Without an explicit export approach via `index.ts`, the assumption is that unnecessary coupling through imports will be avoided by code reviews and developer discipline. This isn't as hard as it sounds; with clear action names, folder structures, and well-defined responsibilities for each piece of code, it's usually obvious when something is being imported from the wrong place or when something needs to be moved to `core/` or `shared/`.

In either case, the ideal state with feature modules is that they are as decoupled from each other as possible. A good litmus test is to delete a feature module folder entirely from the repository and see what breaks in the build. Ideally, the only breakages should be in an upstream `routes.ts` file(s) - possibly `app.routes.ts` - that were trying to lazy-load that feature.

---

[Back to top](#table-of-contents)

## Lazy-loading Approach

Lazy-loading is a design pattern that allows you to load feature modules on demand, rather than at application startup. This can significantly improve the initial load time of your application, as only the necessary code is loaded upfront.

In Angular, lazy-loading is typically achieved using the Angular Router. By defining routes for your feature modules, you can instruct the router to load the module only when the user navigates to that route.

To implement lazy-loading, you need to follow these steps:

1. **Create a feature module**: Generate a new module for your feature using the Angular CLI.

2. **Define routes**: In the feature module, define the routes for the components that belong to that feature.

3. **Configure lazy-loading**: In the main application routing module, configure the router to load the feature module lazily using the `loadChildren` property.

4. **Optimize loading**: Use techniques like route preloading and code splitting to further optimize the loading of your feature modules.
  
To get the best of both worlds, i.e. fast initial load time and responsive navigation, it's recommended to combine lazy-loading with route preloading strategies. This way, while the initial load is kept minimal, other feature modules can be loaded in the background after the app has started, ensuring that when the user navigates to those features, they load quickly. This is done like so:

```typescript
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

```typescript
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

```typescript
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

```typescript
// baz-feature/routes.ts
import { provideState } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';

import { bazFeature } from './store/baz.reducer';
import { BazEffects } from './store/baz.effects';

export const routes = [
  {
    path: '',
    component: BazComponent,
    providers: [
      provideState(bazFeature.featureKey, bazFeature.reducer),
      provideEffects(BazEffects),
    ],
  },
];
```

> Note: The lazy-loaded approach doesn't replace the root/core store. The root store can and should hold global state that is relevant across the entire application, such as authentication status, user profile, or application settings.

---

[Back to top](#table-of-contents)

## Declarative Route-Driven Orchestration

For scalable SPAs, the current route should be the driving force in answering the question of "what data should be loaded where?"

> The exception being long-lived reference data from non-parameterized API routes in which case it's often simpler to handle in a service that fetches and caches the data on demand when observables or signals are subscribed to.

Routes are one of the most stable and explicit expressions of user intent in a frontend application. A user navigates somewhere because they intend to view or interact with something. That makes the route the natural place to define data-loading policy:

- **What** data is required for this screen to be useful
- **When** it should be fetched or refreshed
- **How long** it should be retained
- **What happens on failure** (retry, show error, redirect, etc.)

If data loading policy is implicit (spread across lifecycle hooks, services, or child components), it becomes inconsistent, hard to reason about, and difficult to review. If it is route-driven and centralised in NgRx effects, it becomes explicit, testable, and easy to discuss in PR reviews.

There are three major motivations for this approach:

1. **Reducing unnecessary backend load**  
   Every unnecessary request we prevent lightens the load on our backend services. This doesn’t just save infrastructure cost — it improves response times across the board. Backend systems degrade non-linearly under load; reducing waste improves performance for everyone. Good frontend orchestration is therefore also a form of backend optimisation.

2. **Preserving user flow and responsiveness**  
   We should prioritise immediate UI feedback over strict data guarantees at route time. Users do not require data instantly; they require acknowledgement instantly.

3. **Simplifying mental models and code review**  
   When data loading is route-driven and centralised in effects, the mental model is clear: “What route are you on? That determines what data should be loaded.” This makes it easier for developers to reason about the code and for reviewers to verify that data isn’t being loaded unnecessarily or in the wrong places.


So, given the above, where in our code do we begin to load data?


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



### ✅ The route-driven NgRx approach

Use the router configuration as the **single, explicit place** to declare *screen entry intent*.

- Routes declare *when a user has entered a screen* (and with which parameters)
- The route hook dispatches a single **entered/routeEntered** action with a typed payload
- Effects own *all* orchestration (fetching, ensuring loaded, refresh triggers, failure handling)
- Components remain dumb: they render based on store state and report user intent

This gives you a stable, review-friendly mental model:

> “What route are you on?”  
> → “That determines which ‘entered’ action is dispatched.”  
> → “Effects decide what to load and when.”

The key is that the route hook should be treated as a **policy trigger**, not a hydration mechanism. We intentionally avoid blocking navigation on API calls.

In practice, this means accepting that the Angular Router is *imperative plumbing* (it calls `resolve` / `canActivate` / `canDeactivate` functions), while our architecture aims to be as *declarative* as possible.
To bridge that gap, we define a small set of `core/` utilities that:

- extract route params in a consistent way (including from parent routes)
- map them into **typed action payloads**
- dispatch a single, reviewable store action and return `true`

`dispatchWithParams` is the simplest example of this plumbing utility.

```typescript
// features/foo-feature/routes.ts
import { dispatchWithParams } from '@core/utils/route-utils';

export const routes = [
  {
    path: `:${RouteParam.ID}`,
    component: FooPageComponent,
    resolve: [
      dispatchWithParams(
        // action w/ payload { id: string, sectionId: string  }
        FooActions.entered,
        [RouteParam.SECTION_ID, RouteParam.ID] as const,
      ),
    ],
  },
];
```
> See the Code Appendix at the end of this document for the implementation of `dispatchWithParams` and related utilities.

### Using `dispatchWithParams` in guards

`dispatchWithParams` is designed to work in any router hook where you want *explicit, reviewable orchestration triggers*.

This can be useful when:

- you want to dispatch telemetry or “screen entered” actions from `canActivate`
- you want to persist draft state, stop polling, or emit “screen leaving” actions from `canDeactivate`

The important rule is the same as for resolvers:

- **Don’t use guards to hydrate page data** (i.e. don’t await API calls just to render the page)
- Treat guards as **policy triggers** (dispatch an action) and optionally **policy gates** (block/redirect) when you truly need to

#### Example: `canActivate` with a check on Foo status object.

```typescript
// features/foo-feature/routes.ts
import { dispatchWithParams } from '@core/utils/route-utils';

export const routes = [
  {
    path: `:${RouteParam.ID}`,
    component: FooPageComponent,
    canActivate: [
      dispatchWithParams(
        FooActions.enterAttempted,
        [RouteParam.SECTION_ID, RouteParam.ID] as const,
      ),
      waitForFooStatusCheck({
        canActivateIf: [FooStatus.Draft, FooStatus.InReview],
        elseRedirectTo: '/foo-unavailable',
      }),
    ],
  },
];
```

#### Example: `canDeactivate` that blocks on a store-driven intent resolution

```typescript
// features/foo-feature/routes.ts
import { dispatchWithParams } from '@core/utils/route-utils';

export const routes = [
  {
    path: `:${RouteParam.ID}`,
    component: FooPageComponent,
    canDeactivate: [
      dispatchWithParams(
        FooActions.leaveAttempted,
        [RouteParam.SECTION_ID, RouteParam.ID] as const,
      ),
      waitForSaveChangesModal(), // blocks until store/effects resolve intent
    ],
  },
];
```

This pattern keeps param mapping fully explicit (good for PR review) while still allowing truly-blocking flows (auth checks, save-confirm modals, etc.) to be implemented as dedicated guards.


### NgRx effect orchestration

Routes drive orchestration in terms of navigation, but the actual orchestration logic lives in NgRx effects.

Once route entry dispatches an `entered()` action, all loading and refresh policy lives in effects.

The guiding principle is that orchestration belongs in effects, not components.

Below are some common patterns for effect orchestration:

#### Pattern 1: Always refresh on entry (simple and predictable)

```typescript
@Injectable()
export class FooEffects {
  private readonly actions$ = inject(Actions);
  private readonly fooApi = inject(FooHttpService);

  loadOnEntry$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FooActions.entered),
      switchMap(({ id }) =>
        this.fooApi.getFoo(id).pipe(
          map(foo => FooActions.loadFooSuccess({ foo })),
          catchError(error => of(FooActions.loadFooFailure({ error }))),
        ),
      ),
    ),
  );
}
```

This is often the best default. It is easy to understand, easy to test, and easy to review.

#### Pattern 2: Ensure-loaded + explicit refresh triggers

When you want snappy navigation without redundant calls:

```typescript
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
      switchMap(({ id }) =>
        this.fooApi.getFoo(id).pipe(
          map(foo => FooActions.loadFooSuccess({ foo })),
          catchError(error => of(FooActions.loadFooFailure({ error }))),
        ),
      ),
    ),
  );

  refreshAfterMutation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(FooActions.updateFooSuccess),
      exhaustMap(({ id }) =>
        this.fooApi.getFoo(id).pipe(
          map(foo => FooActions.loadFooSuccess({ foo })),
          catchError(error => of(FooActions.loadFooFailure({ error }))),
        ),
      ),
    ),
  );
}
```

This makes reload policy explicit and reviewable:

- On route entry: ensure data exists
- After mutations: refresh deliberately

No lifecycle guesswork. No hidden coupling.

#### Pattern 3: Advanced orchestration with declarative abstraction

When a feature depends on upstream feature state (e.g. Baz depends on Foo), the orchestration logic can become verbose and difficult to read if written directly in RxJS.

In these cases, it can be valuable to encapsulate the common “wait / abort / fetch” pattern in a shared base class and expose a small, declarative API.


Example usage:

```typescript
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
          waitForTruthy: FromFoo.selectFoos,

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
    )
  );
}
```

> See the Code Appendix at the end of this document for the implementation of `EffectFlowBase` and the `then` operator.


With this approach, the effect reads as a short, linear narrative:

- Wait for upstream data to be available
- Abort if a failure occurs
- Fetch dependent data
- Map to success or error actions

This removes most RxJS ceremony from the call site and makes the intent immediately clear in PR reviews.

This 3rd pattern illustrates the power of declarative code combined with RxJS orchestration: we can express complex dependencies and policies in a way that is still readable, testable, and reviewable.


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

---

[Back to top](#table-of-contents)

## Component ViewModel Pattern

The final piece of the architecture puzzle is the Component ViewModel Pattern, which is a design approach that aims to simplify the management of component state and data transformation in Angular applications. By leveraging Angular signals and NgRx's `selectSignal`, this pattern allows for a clear separation of concerns between the component's UI logic and the underlying state management.

A ViewModel is a data structure that represents the state of a UI component or screen in a way that is optimized for rendering. It typically contains all the data and state needed to render the UI, as well as any derived or computed values that are needed for display.

In the architecture recommended here, ViewModels are implemented using Angular signals and NgRx's `selectSignal` to derive state from the store. The ViewModel is exposed to the component template via a `readonly vm = computed(...)` property.

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
  
  // Local component state.
  // i.e. a typeahead search text or an expanded/collapsed state.
  private readonly searchTextS = signal('');
  private readonly expandedS = signal(true);

  readonly vm = fooSidebarVM(this.store, this.searchTextS, this.expandedS);

  constructor() {
    effect(() => {
      // Example of a side effect that runs whenever the ViewModel changes.
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

This `*.viewmodel.ts` is where we define the ViewModel and should always be found alongside the `*.component.ts` for which it defines a ViewModel for.

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
  foos: Foo[] | null | undefined;
  fooError: any;
  inputText: string;
  selectedId: string | null;
  searchText: string;
  expanded: boolean;
}): FooSidebarVM {

  // It's often worth creating intermediate variables.
  // For complex conditions it will improve readability.

  // Loading vs. empty result vs. failed etc.
  // Make sure even unexpected edge cases are handled
  const isLoading = input.foos === undefined || input.foos === null;

  const foos = input.foos ?? [];
  const hasFoos = foos.length > 0;

  const hasPermissionToSendMessage = input.permissions.includes('can_send_message');
  const canSendMessage = hasPermissionToSendMessage && !isLoading && hasFoos;

  return {
    showLoadingState: isLoading,
    showFooMessageInput: canSendMessage && input.expanded,
    fooMessageInputValue: input.inputText,
    foosToDisplay: foos
      .map(foo => ({
        id: foo.id,
        name: foo.name,
        description: foo.description ?? '',
        status: foo.status,
        isSelected: foo.id === input.selectedId
      }))
      .filter(foo => foo.name.toLowerCase().includes(input.searchText.toLowerCase())),
    showSendMessageButton: !isLoading && canSendMessage && hasFoos,
    disableSendMessageButton: !input.selectedId || input.inputText.trim() === '',
    errorMessageToShow: input.fooError ? 'Error occurred' : null,
  };
}

/**
 * VM Store -> Signal function.
 */
export function fooSidebarVM(
    store: Store,
    searchText: Signal<string>,
    expanded: Signal<boolean>
  ): Signal<FooSidebarVM> {

  // Domain state (from NgRx as signals)
  const permissions: Signal<string[]> = store.selectSignal(FromCore.selectPermissions);
  const foos: Signal<Foo[]> = store.selectSignal(FromFoo.selectFoos);
  const inputText: Signal<string> = store.selectSignal(FromFoo.selectFooInputText);
  const selectedId: Signal<string> = store.selectSignal(FromFoo.selectSelectedFooId);
  const fooError: Signal<any> = store.selectSignal(FromFoo.selectFooError);

  return computed(() => {
    return mapToFooSidebarVM({
      permissions: permissions(),
      foos: foos(),
      fooError: fooError(),
      inputText: inputText(),
      selectedId: selectedId(),
      searchText: searchText(),
      expanded: expanded()
    });
  });
}
```

Every ViewModel file has three parts:

**1. ViewModel Type Definition**
Defines the contract between the view and the application. The key is making this contract readable from both sides - the component should know what to do with each property, and the ViewModel should clearly indicate its intent. Use as an opportunity to add clarity and intention.

Make sure a future developer is never asking:

- *From `*.viewmodel.ts` side:* "What will the component/view do with this data or flag?"

- *From `*.component.ts` side:* "What am I supposed to do with this data or flag?"

**2. Mapping Function (mapToVM)**
A pure function that transforms raw store data into the ViewModel. This is where you compute derived data and handle transformations.

> **Important**: Be careful with null reference errors - one mistake breaks the entire component. Use strict TypeScript settings, linting rules, and thorough unit testing. These mapping functions are ideal for unit testing and provide the highest ROI for test coverage.

**3. VM Signal Function**
Combines store data and local component state into a single reactive signal. This function is used inside the component and typically needs references to the store and local UI signals.


### Component hierarchy

Imagine the above sidebar component as a child of a `foo/view/foo-page.component.ts`. The same ViewModel pattern would be used for the page component too which would have its own `foo-page.viewmodel.ts`. In fact, not every component needs a ViewModel and it would be more likely that the child component uses signal inputs filled by properties from the parent component's ViewModel.

> The  above begs the question: When *should* a child component of a page or screen have its own ViewModel? Answer: when you want to break up the parent component's ViewModel into smaller pieces for readability and maintainability. This is because if the child component doesn't have a ViewModel then necessarily those input signals will need to be populated by properties from the parent component's ViewModel. If a large part of your `foo-page.viewmodel.ts` is concerned with populating fields for the `foo-sidebar.components.ts` then that might lead you to create a `foo-sidebar.viewmodel.ts` as below.

### Benefits of the Component ViewModel Pattern


The Component ViewModel Pattern offers several key benefits:

1. **Separation of Concerns**: By clearly delineating the responsibilities of views and state management, the pattern promotes a cleaner architecture. Views focus on presentation logic, reactivity and lifecycle events, while ViewModels handle data transformation and business logic.

2. **Testability**: Pure mapping functions are inherently testable. They can be unit tested in isolation, ensuring that the logic for transforming state into view-ready data is correct without the need for complex setup or dependencies.

3. **Clarity and Explicitness**: The ViewModel contract is explicit about what data is available to the view and how it should be used. This clarity helps prevent misunderstandings and makes it easier for developers to work with the code.

4. **Performance Benefits**: Using `computed()` to derive the ViewModel reactively allows for efficient updates. Only the parts of the view that depend on changed data are re-rendered, improving performance.

5. **PR Review Friendliness**: Clear, explicit transformations in the ViewModel are easy to follow and reason about during PR reviews. This transparency helps reviewers understand the intent behind changes and reduces the likelihood of introducing bugs.

---

[Back to top](#table-of-contents)

## Not covered in this document

This document is intended to be a high-level overview of the architecture and doesn't cover every detail or best practice. For example, it doesn't go into detail about:

- NgRx best practices (actions, effects, reducers, selectors, adapters, etc.)
- Angular signals best practices
- Testing strategies for components, ViewModels, and NgRx
- Performance optimization techniques
- Error handling strategies
- Retry policies
- Authentication and authorization patterns

---

[Back to top](#table-of-contents)

## FAQs

### Where do services fit in?

In this guide, we've hardly mentioned services, but they still have an important role to play in the architecture.

It's just important when using them to ask whether NgRx might be a better fit for what you're trying to achieve. Don't fear creating an NgRx store just because it feels like a small amount of state at the time of writing - it's better to have a consistent and predictable codebase and not sweat the boilerplate; especially with generative AI tools, the boilerplate is less of a concern than it used to be.

If your service is managing state that needs to be shared across components, persisted, or coordinated with other features, then NgRx is likely the better choice. On the other hand, if you have complex logic that doesn't fit well in effects or selectors, or if you have a piece of functionality that is purely a utility and doesn't need to manage state, then a service can be a good place for that.

A telltale sign that you might want to use a service class is when you start passing state through sequences of actions so that chains of effects can do different things and the names of the effects start to become less clear.

The key is to keep services focused on a specific domain or area of functionality, and to avoid putting stateful logic in services where possible.


---

[Back to top](#table-of-contents)

## Code Appendix

### Definition of `dispatchWithParams` used in route resolvers:


```typescript
// core/utils/route-utils.ts

function getParamFromSelfOrParents(route: ActivatedRouteSnapshot, key: string): string | null {
  for (let i = route.pathFromRoot.length - 1; i >= 0; i--) {
    const v = route.pathFromRoot[i]!.paramMap.get(key);
    if (v !== null) return v;
  }
  return null;
}

type PayloadFromKeys<TKeys extends readonly string[]> = { [K in TKeys[number]]: string };

// Resolver
export function dispatchWithParams<const TKeys extends readonly string[]>(
  action: (payload: PayloadFromKeys<TKeys>) => unknown,
  params: TKeys,
): ResolveFn<boolean>;

// canActivate
export function dispatchWithParams<const TKeys extends readonly string[]>(
  action: (payload: PayloadFromKeys<TKeys>) => unknown,
  params: TKeys,
): CanActivateFn;

// canDeactivate
export function dispatchWithParams<TComponent, const TKeys extends readonly string[]>(
  action: (payload: PayloadFromKeys<TKeys>) => unknown,
  params: TKeys,
): CanDeactivateFn<TComponent>;

// Implementation
export function dispatchWithParams<TComponent, const TKeys extends readonly string[]>(
  action: (payload: PayloadFromKeys<TKeys>) => unknown,
  params: TKeys,
) {
  return (...args:
    | [ActivatedRouteSnapshot] // resolver
    | [ActivatedRouteSnapshot, RouterStateSnapshot] // canActivate
    | [TComponent, ActivatedRouteSnapshot, RouterStateSnapshot, RouterStateSnapshot] // canDeactivate
  ): boolean => {
    const route =
      args.length === 4
        ? (args[1] as ActivatedRouteSnapshot) // canDeactivate -> currentRoute
        : (args[0] as ActivatedRouteSnapshot); // resolver / canActivate -> route

    const payload = Object.fromEntries(
      params.map((k) => {
        const v = getParamFromSelfOrParents(route, k);
        if (v === null) throw new Error(`Missing route param "${k}"`);
        return [k, v];
      }),
    ) as PayloadFromKeys<TKeys>;

    inject(Store).dispatch(action(payload));
    return true;
  };
}

```

### Definition of `EffectFlowBase` and the `then` operator used in advanced effect orchestration:

```typescript
// core/utils/effect-flow-base.ts

import { Store, MemoizedSelector, Action, ActionCreator, Creator } from '@ngrx/store';
import { Actions, ofType } from '@ngrx/effects';
import { concatLatestFrom } from '@ngrx/operators';
import { Observable, combineLatest, merge, of, race } from 'rxjs';
import { catchError, filter, map, switchMap, take } from 'rxjs/operators';

/**
 * EffectFlowBase
 *
 * A small helper base class for “wait / abort / fetch” orchestration in NgRx effects.
 *
 * What it optimises for:
 * - Effects that read like a short narrative in PRs.
 * - Keeping RxJS ceremony out of call sites.
 * - Reusing a common dependency pattern across features.
 *
 * Convention used by this helper:
 * - We treat "prerequisites are ready" as "selector value is truthy".
 * - i.e. falsy values (undefined / null / false / 0 / '' / NaN) are treated as "still waiting".
 *
 * Important implication:
 * - Only use waitForTruthy with selectors whose "ready" state is represented by a truthy value.
 * - If a legitimate ready value could be falsy (e.g. 0, ''), either:
 *   - change the selector to return a truthy wrapper (e.g. { value: 0 }), or
 *   - write a combined selector that encodes readiness, or
 *   - don't use this helper for that particular prereq.
 */
export abstract class EffectFlowBase {
  protected readonly actions$: Actions;
  protected readonly store: Store;

  protected constructor(actions$: Actions, store: Store) {
    this.actions$ = actions$;
    this.store = store;
  }

  /**
   * skipIfLoaded
   *
   * Simple idempotency guard to avoid refetch storms.
   *
   * Intended usage inside an effect pipeline:
   *
   *   this.actions$.pipe(
   *     ofType(BazActions.entered, FooActions.loadFooDataSuccess),
   *     this.skipIfLoaded(FromBaz.selectBazLoaded),
   *     exhaustMap(() => ...)
   *   )
   *
   * It reads as: "only proceed if this feature isn't already loaded".
   */
  protected skipIfLoaded<TAction>(
    loadedSelector: MemoizedSelector<object, boolean>,
  ): (source$: Observable<TAction>) => Observable<TAction> {
    return (source$) =>
      source$.pipe(
        // Pull in the latest loaded flag for each triggering action
        concatLatestFrom(() => this.store.select(loadedSelector)),
        // Only allow through when not loaded
        filter(([, loaded]) => !loaded),
        // Strip the loaded flag back off
        map(([action]) => action),
      );
  }

  /**
   * then (the main helper)
   *
   * Coordinates a common orchestration pattern:
   * - Start listening for an abort action (or any of several abort actions).
   * - In parallel, wait for prerequisites to become available (truthy).
   * - If abort happens first, dispatch abortWith.
   * - Otherwise, run the provided async work (HTTP call etc) and map to success/error actions.
   *
   * Notes on prerequisites:
   * - If waitForTruthy is a SINGLE selector: we pass its truthy value to cfg.then(prereq).
   * - If waitForTruthy is an ARRAY of selectors: we wait until ALL are truthy.
   *   - We still pass the FIRST selector’s value as prereq to keep the generic type TPrereq meaningful
   *     at the call site without requiring complex tuple typing.
   */
  protected then<TPrereq, TResult>(cfg: {
    /** Selector(s) whose values must be truthy before proceeding */
    waitForTruthy:
      | MemoizedSelector<object, TPrereq | undefined | null>
      | Array<MemoizedSelector<object, any>>;

    /** Action(s) that should abort this flow if observed before prerequisites are ready */
    abortOn:
      | ActionCreator<string, Creator>
      | Array<ActionCreator<string, Creator>>;

    /** Action creator for the abort action to dispatch */
    abortWith: ActionCreator<string, Creator>;

    /** The work to perform once prerequisites are ready */
    then: (prereq: TPrereq) => Observable<TResult>;

    /** Map successful result to an action */
    onSuccess: (result: TResult) => Action;

    /** Map error to an action */
    onError: (error: unknown) => Action;
  }): Observable<Action> {
    const abortCreators = Array.isArray(cfg.abortOn) ? cfg.abortOn : [cfg.abortOn];

    // 1) Abort path: if any abort action fires first, emit abortWith() and end.
    const abort$ = this.actions$.pipe(
      ofType(...abortCreators),
      take(1),
      map(() => cfg.abortWith() as Action),
    );

    // 2) Prereq path: wait until prerequisites are ready (truthy), then run cfg.then(prereq).
    const prereq$ = this.waitForTruthy(cfg.waitForTruthy).pipe(
      take(1),
      // If multiple selectors are supplied, waitForTruthy returns an array of values.
      // We intentionally cast to TPrereq based on the documented rule above.
      map((v) => v as TPrereq),
    );

    const run$ = prereq$.pipe(
      switchMap((prereq) =>
        cfg.then(prereq).pipe(
          map((result) => cfg.onSuccess(result)),
          catchError((err) => of(cfg.onError(err))),
        ),
      ),
    );

    // 3) Race: whichever emits first wins (abort vs run).
    return race(abort$, run$);
  }

  /**
   * waitForTruthy
   *
   * - Single selector: emits the first truthy value and completes.
   * - Multiple selectors: emits when ALL selectors are truthy.
   *
   * Return shape:
   * - Single selector -> value
   * - Multiple selectors -> array of values (same order)
   */
  private waitForTruthy<T>(
    selectorOrSelectors:
      | MemoizedSelector<object, T | undefined | null>
      | Array<MemoizedSelector<object, any>>,
  ): Observable<T | any[]> {
    if (Array.isArray(selectorOrSelectors)) {
      const streams = selectorOrSelectors.map((s) => this.store.select(s));

      return combineLatest(streams).pipe(
        // Only proceed once *all* prereqs are truthy
        filter((values) => values.every(isTruthy)),
      );
    }

    return this.store.select(selectorOrSelectors).pipe(
      // Only proceed once prereq is truthy
      filter(isTruthy),
    );
  }
}

/** Single definition of "ready": truthy. */
function isTruthy<T>(v: T): boolean {
  return !!v;
}


```
