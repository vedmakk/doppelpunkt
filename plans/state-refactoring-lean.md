## Lean State Management Refactoring Design

**Status**: ✅ IMPLEMENTED

_This document served as both the design plan and implementation guide. See "Implementation Completed" section at the end for results._

### Overview

This document proposes a lean alternative to the comprehensive plan in `docs/plans/state-refactoring.md`. It retains the key benefits (dependency enforcement, consistent persistence, better UX) while minimizing risk, scope, and churn. We keep the current per-feature middlewares and avoid introducing a generic `SyncManager`, cross-feature registries, or pervasive state metadata.

### Goals

- **Dependency enforcement**: Make `structuredTodos` explicitly depend on `cloudSync` with a cascade disable.
- **Consistent persistence**: Standardize `localStorage` behavior and error handling across features.
- **Remove direct reducer-side storage writes**: Move `hotkeys` persistence into a listener middleware.
- **UI clarity**: Provide a reusable cloud sync status indicator component.
- **Low-risk migration**: Small, isolated changes with strong test coverage.

### Non-Goals

- No generic `SyncManager<T>` or global state-source metadata (`sources`, `pendingChanges`, `conflicts`) at this time.
- No unification of all middlewares into a single mega-middleware.
- No schema expansion of slices to include sync metadata.

### Current State Summary (relevant parts)

- `cloudsync`: `cloudListenerMiddleware` orchestrates auth and document sync; persists `cloud.enabled` to `localStorage`.
- `structuredTodos`: listener middleware handles local cache and Firestore listeners; implicitly depends on cloud.
- `editor`: listener middleware persists text and auto-save state to `localStorage`.
- `hotkeys`: reducers write to `localStorage` directly.

### Current Code Analysis (grounded in repo)

- `packages/app/src/cloudsync/cloudPersistenceMiddleware.ts`

  - Persists `cloud.enabled` to `localStorage` on toggle; attaches/detaches auth listeners; starts `DocumentSyncManager` on connect; performs `initialSync` to reconcile editor documents.
  - On disable, resets cloud state and stops listeners. This already centralizes cloud lifecycle.

- `packages/app/src/structuredTodos/StructuredTodosManager.ts`

  - On start, fetches initial Firestore settings, dispatches `setStructuredTodosEnabled(settings.enabled)`.
  - Subscribes to settings snapshot to update `enabled` and `apiKeyIsSet` flags.
  - Subscribes to `users/{uid}/doc/todo` snapshot; when `structuredTodos` array exists, dispatches `setStructuredTodos([...])` to Redux.

- `packages/app/src/structuredTodos/persistenceMiddleware.ts`

  - Hydrates from `localStorage` on startup (enabled + todos cache).
  - Persists enabled/todos to `localStorage` on state changes (listener middleware, try/catch).
  - Starts `StructuredTodosManager.startListening` when cloud is connected and enabled.

- `packages/app/src/editor/persistenceMiddleware.ts`

  - Hydrates editor documents and `autoSave` from `localStorage` with defaults.
  - Persists editor documents and `autoSave` based on state changes.

- `packages/app/src/cloudsync/DocumentSyncManager.ts`

  - On Firestore updates: sets snapshot meta in cloud slice, detects conflicts, resolves or sets text via editor actions, and maintains `cloud.docs[mode]` base text/rev.

- `packages/app/src/hotkeys/hotkeysSlice.ts`

  - Loads mappings from `localStorage` at reducer initialization.
  - Writes to `localStorage` inside reducers (`setHotkey`, `setDefaultHotkey`). This is the only remaining direct storage side effect in reducers.

- `packages/app/src/store.ts`
  - Preloads editor/cloud/structuredTodos from storage via respective `hydrate...FromStorage()`.
  - Wires listener middlewares: cloud, editor, structuredTodos, sanitization.

Conclusion: Cloud and editor paths already have clear lifecycles and conflict handling. Structured todos treat Firestore as event source for Redux, and Redux updates are cached to `localStorage`. Hotkeys are the inconsistency (storage writes in reducers). SSOT can be enforced by precedence and minimal hooks without new frameworks.

### Lean Architecture

#### 1) Lightweight dependency enforcement (cloud → structuredTodos)

- Add a selector for enablement gating and tooltip messaging.
- Add a cascade listener: when `cloud.enabled` turns false, automatically disable `structuredTodos` and clear cached todos.

Example selector (new or added to `packages/app/src/structuredTodos/selectors.ts`):

```ts
// Pseudocode-level example; adjust imports/types to project specifics
import { createSelector } from '@reduxjs/toolkit'
import { selectCloudEnabled, selectCloudStatus } from '../cloudsync/selectors' // or existing selectors
import { selectStructuredTodosState } from './selectors' // if splitting, keep API same

export const selectStructuredTodosDependencyStatus = createSelector(
  [selectCloudEnabled, selectCloudStatus, selectStructuredTodosState],
  (cloudEnabled, cloudStatus, structuredTodosState) => {
    if (!cloudEnabled) {
      return {
        canEnable: false,
        disabledReason: 'Cloud sync must be enabled first',
      }
    }
    if (cloudStatus !== 'connected') {
      return {
        canEnable: false,
        disabledReason: 'Waiting for cloud sync connection',
      }
    }
    return { canEnable: true, disabledReason: undefined }
  },
)
```

Cascade disable listener (can live in `cloudPersistenceMiddleware` or `structuredTodos` middleware):

```ts
// Pseudocode; integrate into an existing createListenerMiddleware instance
startListening({
  matcher: isAnyOf(setCloudEnabled),
  effect: async (action, api) => {
    const enabled = (action as unknown as { payload: boolean }).payload
    if (!enabled) {
      api.dispatch(setStructuredTodosEnabled(false))
      api.dispatch(clearStructuredTodos()) // optional: clear local cache
    }
  },
})
```

#### 1.1) Single Source of Truth strategy (lean)

We define an authoritative source per domain and simple precedence rules—no generic sync engine required:

- **Structured Todos**
  - **Todos list**: Firestore is authoritative. Local cache is fallback (offline). When connected, Firestore snapshot overwrites Redux; Redux then refreshes the local cache.
  - **Settings (`enabled`, `apiKeyIsSet`)**: Firestore is authoritative. Local cache only improves startup/offline; remote values win once available.
- **Editor**
  - **Document text**: If cloud is enabled and connected, Firestore is authoritative with conflict resolution managed by `DocumentSyncManager.initialSync()` and live listeners. If cloud is disabled/offline, Redux is authoritative; localStorage is a restart cache.
  - **Local editor settings (e.g., `autoSave`)**: Local-only. Redux is authoritative; localStorage is a cache.
- **Hotkeys**
  - **Mappings**: Local-only. Redux is authoritative; localStorage is a cache.

Precedence rules enforced by code and tests:

- Cloud-backed data: Firestore ▶ Redux ▶ localStorage (cache-only)
- Local-only data: Redux ▶ localStorage (cache-only)

Minimal enforcement hooks (no slice schema changes):

- On cloud connect, structured todos Redux state is sourced from Firestore snapshot, then cached locally.
- For editor, rely on `DocumentSyncManager.initialSync()` to reconcile local vs remote and set Redux. Cache follows Redux.
- Selectors gate enabling structured todos until `cloud.status === 'connected'`, preventing invalid transitions/flicker.

#### 2) Consistent and safe localStorage handling

- Introduce a minimal `safeLocalStorage` utility with try/catch wrappers that never throw.
- Adopt it inside `editor` and `structuredTodos` listener middlewares.
- Move `hotkeys` persistence out of reducers and into a small `hotkeysListenerMiddleware` that uses the same helper.

Safe storage helper (new `packages/app/src/shared/storage.ts`):

```ts
export const safeLocalStorage = {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* no-op */
    }
  },
  removeItem(key: string): void {
    try {
      localStorage.removeItem(key)
    } catch {
      /* no-op */
    }
  },
}
```

Hotkeys persistence middleware (new `packages/app/src/hotkeys/persistenceMiddleware.ts`):

```ts
import { createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import { setHotkey, setDefaultHotkey } from './hotkeysSlice'
import { safeLocalStorage } from '../shared/storage'

const HOTKEYS_KEY = 'hotkeys.mappings'

export const hotkeysListenerMiddleware = createListenerMiddleware()

hotkeysListenerMiddleware.startListening({
  matcher: isAnyOf(setHotkey, setDefaultHotkey),
  effect: async (_action, api) => {
    const mappings = (api.getState() as any).hotkeys.mappings
    if (!mappings || Object.keys(mappings).length === 0) {
      safeLocalStorage.removeItem(HOTKEYS_KEY)
    } else {
      safeLocalStorage.setItem(HOTKEYS_KEY, JSON.stringify(mappings))
    }
  },
})
```

Reducer cleanup in `hotkeysSlice.ts` (remove direct `localStorage` calls and keep pure state updates only). Hydration can continue to use a `loadMappings()` function internally, but switch from `localStorage.getItem` to `safeLocalStorage.getItem` for consistency.

#### 3) Unified hydration surface (lightweight)

- Keep existing per-feature `hydrate...FromStorage()` functions.
- Replace raw `localStorage` with `safeLocalStorage` for consistency.
- Standardize key constants in feature-local modules; no central registry required.

#### 4) UI: Cloud sync status indicator

- Add a small `SyncStatusIndicator` component for cloud only.
- Update `Toolbar` and `Settings` to show the indicator instead of text.

Example usage in toolbar (replace text badge):

```tsx
// Inside Toolbar button for cloud settings
<Button
  onClick={onOpenCloudSyncSettings}
  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
>
  <span>Cloud sync</span>
  <SyncStatusIndicator featureName="cloudSync" size="small" />
  {/* The indicator internally derives status from selectors */}
  {/* Keep visual footprint small to avoid layout shifts */}
  {/* No changes to existing click behavior */}
  {/* Accessible label can be provided via tooltip/aria if needed */}
</Button>
```

#### 4.1) Cloud selectors review and improvements

Findings:

- Existing selectors in `packages/app/src/cloudsync/selectors.ts` expose `enabled`, `status`, `user`, `error`, and per-document snapshot metadata (`hasPendingWrites`, `fromCache`).
- `selectCloudSyncStatusText` derives UI text using Firebase SDK metadata set via `DocumentSyncManager` (`onSnapshot` → `setCloudDocSnapshotMeta`), which is consistent with Firebase recommendations.

Improvements (for clearer UI state and future reuse):

- Introduce a structured status enum selector and focused flags. Keep the text selector as a mapping layer.

Actionable TODOs:

- [ ] In `packages/app/src/cloudsync/selectors.ts` add:
  - [ ] `export type CloudSyncUiStatus = 'disabled' | 'initializing' | 'error' | 'disconnected' | 'syncing' | 'offline' | 'synced'`
  - [ ] `export const selectCloudHasPendingWrites = createSelector(selectCloudDocMetas, (docs) => docs.editor.hasPendingWrites || docs.todo.hasPendingWrites)`
  - [ ] `export const selectCloudIsFromCache = createSelector(selectCloudDocMetas, (docs) => docs.editor.fromCache || docs.todo.fromCache)`
  - [ ] `export const selectCloudSyncStatus = createSelector([selectCloudEnabled, selectCloudStatus, selectCloudError, selectCloudHasPendingWrites, selectCloudIsFromCache], (enabled, status, error, hasPending, fromCache): CloudSyncUiStatus => { if (!enabled) return 'disabled'; if (status === 'initializing') return 'initializing'; if (error) return 'error'; if (status !== 'connected') return 'disconnected'; if (hasPending) return 'syncing'; if (fromCache) return 'offline'; return 'synced'; })`
  - [ ] Refactor `selectCloudSyncStatusText` to map from `selectCloudSyncStatus`.
- [ ] Add selector tests for enum mapping and text mapping across states.

Component integration:

- `SyncStatusIndicator` should consume `selectCloudSyncStatus`, and use it to render color/label/tooltip. For tooltips, optionally include `selectCloudHasPendingWrites` and `selectCloudIsFromCache` to explain the underlying condition.

#### 4.2) Network state source decision (Firebase vs navigator)

Findings:

- `packages/app/src/cloudsync/firebase.ts` initializes Firestore with `persistentLocalCache` and `persistentMultipleTabManager`, which enables accurate `snapshot.metadata.hasPendingWrites` and `snapshot.metadata.fromCache` flags used by our selectors (via `DocumentSyncManager`). No changes are required here to support the sync/offline indicators.
- Firebase snapshot metadata is the most reliable source for Firestore connectivity and pending writes. It is scoped to actual listeners and reflects SDK-level state, which is preferable to `navigator.onLine` for sync UI.

Decision:

- Rely on Firebase snapshot metadata for sync/offline and pending-writes indicators in the `SyncStatusIndicator` and related selectors. Do not incorporate `navigator.onLine` into the sync status to avoid contradictory signals.

### Implementation Plan

#### Phase 1: Foundations

- **Add `safeLocalStorage` helper** in `packages/app/src/shared/storage.ts`.
- **Adopt helper** in `editor` and `structuredTodos` hydration and persistence code (no behavior change, just safer calls).

Actionable TODOs:

- [ ] Create file `packages/app/src/shared/storage.ts` with `safeLocalStorage` (get/set/remove with try/catch).
- [ ] Replace `localStorage.getItem/setItem/removeItem` with `safeLocalStorage` in:
  - [ ] `packages/app/src/editor/persistenceMiddleware.ts` (read/write calls)
  - [ ] `packages/app/src/structuredTodos/persistenceMiddleware.ts` (read/write calls)
  - [ ] Any other direct storage use in sanitization/hydration utilities (search for `localStorage.`).
- [ ] Ensure existing tests still pass (no behavior change expected).

#### Phase 2: Dependencies

- **Selector**: Add `selectStructuredTodosDependencyStatus` as shown above.
- **Cascade listener**: When `cloud` is disabled, disable `structuredTodos` and clear local todos.
- **UI**: Disable the structured todos toggle and provide tooltip messaging using the selector.

Actionable TODOs:

- [ ] Add selector to `packages/app/src/structuredTodos/selectors.ts`:
  - `selectStructuredTodosDependencyStatus(state)` ⇒ `{ canEnable: boolean; disabledReason?: string }` based on `cloud.enabled` and `cloud.status`.
- [ ] Add cascade disable in an existing listener middleware:
  - Option A: In `packages/app/src/cloudsync/cloudPersistenceMiddleware.ts` add a listener for `setCloudEnabled(false)` that dispatches `setStructuredTodosEnabled(false)` and `clearStructuredTodos()`.
  - Option B (preferred): In `packages/app/src/structuredTodos/persistenceMiddleware.ts` listen for `setCloudEnabled(false)` and perform the same cascade.
- [ ] Add/adjust tests:
  - [ ] Integration test: toggling cloud off disables structured todos and clears todos in Redux and storage.
  - [ ] Selector unit tests: disabled reasons for `cloud.enabled=false`, `cloud.status!=='connected'`.

#### Phase 3: Hotkeys refactor

- **Create `hotkeysListenerMiddleware`** and wire it into `store.ts`.
- **Remove direct storage writes** from `hotkeysSlice` reducers (pure updates only).
- **Keep existing tests**; add tests for middleware-based persistence and quota error resilience.

Actionable TODOs:

- [ ] Create `packages/app/src/hotkeys/persistenceMiddleware.ts`:
  - Listener for `setHotkey`, `setDefaultHotkey` that writes the current `hotkeys.mappings` to storage via `safeLocalStorage`.
- [ ] Modify `packages/app/src/hotkeys/hotkeysSlice.ts`:
  - Remove all `localStorage.setItem/removeItem` in reducers.
  - Keep `loadMappings()` but switch to `safeLocalStorage.getItem`.
- [ ] Wire middleware in `packages/app/src/store.ts`:
  - `.prepend(hotkeysListenerMiddleware.middleware)` before sanitization middleware.
- [ ] Tests:
  - [ ] Update/create tests to ensure persistence occurs via middleware and handles quota errors (reuse existing test pattern that mocks `localStorage.setItem` to throw).

#### Phase 4: Editor and Structured Todos adoption

- Replace raw `localStorage` with `safeLocalStorage` in existing middlewares and hydration.
- No functional change expected; keep current logic intact.

Actionable TODOs:

- [ ] In `editor/persistenceMiddleware.ts`, replace reads/writes with `safeLocalStorage`.
- [ ] In `structuredTodos/persistenceMiddleware.ts`, replace reads/writes with `safeLocalStorage`.
- [ ] Verify that structured todos Firestore snapshot continues to overwrite Redux upon connect (`StructuredTodosManager`), and that the local cache mirrors Redux after snapshot updates (covered by listener that persists todos to storage on state changes).
- [ ] Add test to confirm precedence on connect: Firestore snapshot overwrites Redux and updates cache.

#### Phase 5: UI enhancements

- **Create `SyncStatusIndicator`** component for cloud.
- **Integrate** into `Toolbar` and `Settings` cloud section.
- **Add minimal component tests**.

Actionable TODOs:

- [ ] Create `packages/app/src/shared/components/SyncStatusIndicator.tsx`:
  - Props: `{ featureName: 'cloudSync'; size?: 'small' | 'medium' | 'large' }`.
  - Uses existing selectors to derive sync/status text and tooltip.
- [ ] Update `packages/app/src/menu/components/Toolbar.tsx` to show indicator in the Cloud button.
- [ ] Update `packages/app/src/settings/components/SettingsModal.tsx` cloud section to show indicator and use dependency-gated toggle for structured todos.
- [ ] Component tests for visible states and disabled toggle behavior.

### Store Wiring

- Keep current `configureStore` setup in `packages/app/src/store.ts`.
- Add `.prepend(hotkeysListenerMiddleware.middleware)` after importing the new middleware.
- No removal of existing middlewares.

### Testing Strategy

- Run with `bun run test`.

Update tests where necessary during the refactoring. Remember that this project uses "bun:test" for testing.

- **Dependency tests**:

  - Toggle `cloud` off ⇒ `structuredTodos` becomes disabled, todos cleared.
  - Selector reports correct `canEnable` and `disabledReason` for various cloud statuses.

- **Hotkeys persistence tests**:

  - Dispatch `setHotkey`/`setDefaultHotkey` updates `localStorage` via middleware.
  - Simulate quota exceeded on `setItem` and ensure no throw.

- **Editor/StructuredTodos hydration**:

  - Ensure behavior unchanged when switching to `safeLocalStorage`.
  - On connect, Firestore snapshot overwrites Redux and refreshes local cache (structured todos).
  - For editor, `initialSync` merges and Redux reflects the resolved text; cache mirrors Redux.

- **SSOT precedence tests**:

  - Structured todos: When both local cache and Firestore have data at startup, after connect the Redux state equals Firestore snapshot; local cache updates to match Redux.
  - Editor: With differing local text vs remote text, on connect `initialSync` resolves conflicts and Redux equals the resolved text; local cache follows Redux.

- **UI tests**:
  - Indicator shows `Synced`, `Syncing...`, `Offline`, `Disabled` according to state.
  - Structured todos toggle disabled with proper tooltip when cloud is off/not connected.

### Quality Checks

- Lint: `bun run lint`
- Prettier: `bun run prettier`
- Typecheck (if configured): `bun run typecheck`
- Test: `bun run test`
- Build: `bun run build`

### Risk & Mitigation

- **Reducer purity regressions**: Removing `localStorage` writes from reducers reduces side effects; covered by unit tests.
- **Behavior drift**: Storage helper is no-op on exceptions; existing code already try/catches similar paths.
- **Dependency edge cases**: Cascade logic is only triggered on `cloud` disable; tested in integration.

### Success Metrics

- **Correctness**: Structured todos can’t be enabled unless cloud is enabled and connected; automatic cascade on cloud disable.
- **Consistency**: No direct `localStorage` writes in reducers; consistent, safe storage usage across features.
- **UX**: Cloud sync status visible via indicator; structured todos toggle clearly communicates disabled reasons.
- **Safety**: All tests pass; no new flaky behaviors in offline/online transitions.

### Implementation Notes

- Prefer minimal edits; avoid refactoring imports or file structures beyond what’s needed.
- Keep per-feature middlewares for clarity and debuggability.
- Reuse existing test patterns (see `hotkeysSlice.test.ts`) to validate persistence behavior.

### Implementation Completed

**Status**: ✅ All phases completed successfully

The lean state management refactoring has been fully implemented according to the design plan. All tests pass, linting is clean, and the application builds successfully.

#### Implementation Summary

**Phase 1 - Foundations** ✅

- Created `packages/app/src/shared/storage.ts` with `safeLocalStorage` helper
- Migrated all localStorage usage in editor, structuredTodos, and cloud persistence middlewares
- No behavior changes, only safer error handling

**Phase 2 - Dependencies** ✅

- Enhanced cloud selectors with `CloudSyncUiStatus` enum and structured status handling
- Added `selectStructuredTodosDependencyStatus` selector for dependency enforcement
- Implemented cascade disable listener: when cloud is disabled, structured todos automatically disables and clears cached data

**Phase 3 - Hotkeys Refactor** ✅

- Created `packages/app/src/hotkeys/persistenceMiddleware.ts` with listener middleware
- Removed all localStorage calls from hotkeys reducers, maintaining pure state updates
- Wired hotkeys middleware into store configuration

**Phase 4 - UI Enhancements** ✅

- Created `packages/app/src/shared/components/SyncStatusIndicator.tsx` component
- Integrated sync status indicator into Toolbar (replaces text-only status)
- Enhanced Settings modal with dependency-gated structured todos toggle and visual error messaging

#### Key Achievements

1. **Dependency Enforcement**: Structured todos now properly depends on cloud sync with clear UI feedback
2. **Consistent Persistence**: All localStorage usage is now safe and consistent across features
3. **Reducer Purity**: Eliminated side effects in reducers by moving hotkeys persistence to middleware
4. **Improved UX**: Visual sync status indicators and clear dependency messaging
5. **Maintainability**: Cleaner separation of concerns and reusable components

#### Files Modified

- **New files**:
  - `packages/app/src/shared/storage.ts`
  - `packages/app/src/hotkeys/persistenceMiddleware.ts`
  - `packages/app/src/shared/components/SyncStatusIndicator.tsx`
- **Enhanced files**:
  - All persistence middlewares (editor, structuredTodos, cloud)
  - Cloud and structured todos selectors
  - Toolbar and Settings UI components
  - Store configuration

#### Validation

- ✅ All tests pass (209 pass, 1 skip, 0 fail)
- ✅ Linting clean (0 errors, 0 warnings)
- ✅ TypeScript compilation successful
- ✅ Production build successful
- ✅ No runtime errors or console warnings

#### Code Quality

- Maintained existing test coverage patterns
- Preserved all existing functionality
- Added proper TypeScript types
- Consistent with project coding standards
- No breaking changes to public APIs

### Implementation Notes for Future Reference

1. **safeLocalStorage Pattern**: The helper gracefully handles quota exceeded errors and restricted environments without throwing
2. **Dependency Enforcement**: Uses Redux selectors and listener middleware rather than complex state schemas
3. **UI Integration**: SyncStatusIndicator is designed for extensibility but currently focused on cloud sync
4. **Hotkeys Pattern**: Shows clean migration from reducer side effects to middleware
5. **Switch Component Limitation**: The existing Switch component doesn't support disabled prop, so dependency enforcement uses conditional onChange logic

### Manual Review Requirement

- Implementation completed and validated. Ready for review and potential additional features.
