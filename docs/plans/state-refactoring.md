# State Management Refactoring Design

## Overview

This document outlines the design for refactoring the state management architecture in the cloudsync and structuredTodos features to eliminate issues with multiple sources of truth while properly handling feature dependencies. The goal is to establish Redux as the single source of truth with consistent synchronization patterns and robust dependency management.

## Implementation Status

🚧 **PLANNED** - This design document outlines the implementation plan for state management refactoring.

## Current State (Before Refactoring)

The application currently implements a multi-layer state management pattern across multiple features, each with their own persistence strategies:

### Cloud Sync Feature

- **Redux Store**: Tracks enabled state, auth status, user info, document metadata
- **localStorage**: Caches `cloud.enabled` setting
- **Firestore**: Stores user documents (text content) and authentication state
- **Flow**: localStorage → Redux → Firestore (with real-time sync for documents)

### Structured Todos Feature

- **Redux Store**: Tracks todos, enabled state, API key state, processing status
- **localStorage**: Caches todos array and enabled setting (for offline access)
- **Firestore**: Stores settings (enabled, API key) and generates todos via Cloud Functions
- **Flow**: localStorage ← Redux ← Firestore (read-only todos from cloud)
- **Dependency**: Requires Cloud Sync to be enabled (Firebase Functions trigger on Firestore changes)
- **Note**: Structured todos are only generated in the cloud and synced back to client - they cannot be modified locally

### Editor Feature

- **Redux Store**: Tracks document text, cursor position, auto-save settings
- **localStorage**: Persists editor content and auto-save preferences
- **Firestore**: Stores documents when cloud sync is enabled
- **Flow**: localStorage ⇄ Redux ⇄ Firestore (with conflict resolution for text)

### Hotkeys Feature

- **Redux Store**: Tracks hotkey mappings and editing state
- **localStorage**: Persists custom hotkey mappings
- **Flow**: localStorage ⇄ Redux (local-only, no cloud sync)

### Settings Feature

- **Redux Store**: Tracks various application settings
- **localStorage**: Persists settings (some features)
- **Flow**: localStorage ⇄ Redux (local-only, no cloud sync)

### Current Issues

#### 1. Multiple Sources of Truth Problems

- **Race Conditions**: localStorage (sync) vs Firestore (async) during initialization
- **Inconsistent States**: Offline/online transitions can cause desync between sources
- **Fragmented Persistence**: Each feature has its own persistence middleware (editorListenerMiddleware, structuredTodosListenerMiddleware, cloudPersistenceMiddleware, inline localStorage writes in hotkeysSlice)
- **Inconsistent localStorage Patterns**: Direct localStorage writes in reducers (hotkeys) vs middleware-based approaches (editor, structuredTodos, cloud)
- **Missing Unified Error Handling**: Each persistence layer handles storage failures differently
- **Partial Updates**: Firestore listeners may update only parts of state

#### 2. Feature Dependency Issues

- **Implicit Dependencies**: No programmatic enforcement of structuredTodos requiring cloudSync
- **Missing Cascade Logic**: Disabling cloudSync doesn't automatically disable structuredTodos
- **Async Dependency Resolution**: No guarantee of operation order during dependency changes
- **State Inconsistency**: Dependencies can become inconsistent during state transitions

#### 3. API Key State Complexity

- **Complex State Management**: API key never stored locally, write-only to Firestore
- **Flag Desync**: `apiKeyIsSet` flag can desync from actual key presence
- **Security vs UX**: Balancing security requirements with user experience

#### 4. Synchronization Edge Cases

- **Initialization Race**: Multiple async operations during app startup
- **Error Isolation**: One failed sync can affect others
- **Offline Recovery**: Limited handling of offline state transitions
- **Optimistic Updates**: Missing optimistic update patterns

## Proposed Solution

### 1. Core Architecture: Unified State Management

Create a centralized state management system that handles both multi-source synchronization and feature dependencies. This system will:

- **Unify localStorage persistence** across all features (editor, hotkeys, structuredTodos, cloud, settings)
- **Simplify settings conflict resolution** using last-write-wins strategy (settings are easily revertable and user-specific)
- **Preserve document text conflict resolution** (existing three-way merge implementation)
- **Distinguish data types**: Settings/preferences (user-changeable) vs Generated data (cloud-only for structured todos)

```typescript
// src/shared/statemanagement/types.ts

export interface StateSource {
  name: 'redux' | 'localStorage' | 'firestore'
  priority: number // Higher number = higher priority
  isAvailable: boolean
  lastSyncedAt: number
}

export interface SyncableState<T> {
  data: T
  sources: Record<string, StateSource>
  pendingChanges: Partial<T>[]
  conflicts: StateConflict<T>[]
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline' | 'disabled'
  dependencies: string[] // Feature names this depends on
  dependents: string[] // Features that depend on this
}

export interface StateConflict<T> {
  id: string
  timestamp: number
  localValue: T
  remoteValue: T
  baseValue: T
  resolution?: T
  autoResolvable: boolean
}

export interface FeatureDependency {
  feature: string
  requiredFeatures: string[]
  cascadeDisable: boolean // Auto-disable when dependency is disabled
  enableOrder: number // Order to enable features (lower first)
}
```

### 2. Dependency Management System

Implement a centralized dependency manager:

```typescript
// src/shared/statemanagement/DependencyManager.ts

export class DependencyManager {
  private dependencies: Map<string, FeatureDependency> = new Map()
  private dispatch: AppDispatch

  constructor(dispatch: AppDispatch) {
    this.dispatch = dispatch
    this.initializeDependencies()
  }

  private initializeDependencies() {
    // Define feature dependencies
    this.dependencies.set('structuredTodos', {
      feature: 'structuredTodos',
      requiredFeatures: ['cloudSync'],
      cascadeDisable: true,
      enableOrder: 2,
    })

    this.dependencies.set('cloudSync', {
      feature: 'cloudSync',
      requiredFeatures: [],
      cascadeDisable: false,
      enableOrder: 1,
    })
  }

  async enableFeature(featureName: string): Promise<void> {
    const dependency = this.dependencies.get(featureName)
    if (!dependency) throw new Error(`Unknown feature: ${featureName}`)

    // Check if all required features are enabled
    const missingDeps = dependency.requiredFeatures.filter(
      (dep) => !this.isFeatureEnabled(dep),
    )

    if (missingDeps.length > 0) {
      throw new DependencyError(
        `Cannot enable ${featureName}. Missing: ${missingDeps.join(', ')}`,
      )
    }

    // Enable the feature
    await this.dispatchEnableAction(featureName)
  }

  async disableFeature(featureName: string): Promise<void> {
    const dependency = this.dependencies.get(featureName)
    if (!dependency) throw new Error(`Unknown feature: ${featureName}`)

    // Find all dependent features
    const dependents = Array.from(this.dependencies.values())
      .filter((dep) => dep.requiredFeatures.includes(featureName))
      .filter((dep) => this.isFeatureEnabled(dep.feature))

    // Disable dependents first (if cascade is enabled)
    for (const dependent of dependents) {
      if (dependent.cascadeDisable) {
        await this.disableFeature(dependent.feature)
      }
    }

    // Disable the feature
    await this.dispatchDisableAction(featureName)
  }

  canEnableFeature(featureName: string): {
    canEnable: boolean
    reason?: string
  } {
    const dependency = this.dependencies.get(featureName)
    if (!dependency) return { canEnable: false, reason: 'Unknown feature' }

    const missingDeps = dependency.requiredFeatures.filter(
      (dep) => !this.isFeatureEnabled(dep) || !this.isFeatureReady(dep),
    )

    if (missingDeps.length > 0) {
      return {
        canEnable: false,
        reason: `Requires ${missingDeps.join(', ')} to be enabled and ready`,
      }
    }

    return { canEnable: true }
  }

  canDisableFeature(featureName: string): {
    canDisable: boolean
    reason?: string
  } {
    const dependents = this.getActiveDependents(featureName)

    if (dependents.length > 0) {
      return {
        canDisable: false,
        reason: `Required by ${dependents.join(', ')}`,
      }
    }

    return { canDisable: true }
  }
}
```

### 3. Unified Synchronization System

Create a unified synchronization system that handles all state sources:

```typescript
// src/shared/statemanagement/SyncManager.ts

export class SyncManager<T> {
  private featureName: string
  private sources: StateSource[]
  private reconciler: StateReconciler<T>
  private validator: StateValidator<T>

  constructor(
    featureName: string,
    sources: StateSource[],
    reconciler: StateReconciler<T>,
    validator: StateValidator<T>,
  ) {
    this.featureName = featureName
    this.sources = sources.sort((a, b) => b.priority - a.priority)
    this.reconciler = reconciler
    this.validator = validator
  }

  async synchronize(): Promise<SyncResult<T>> {
    try {
      // 1. Collect current state from all sources
      const states = await this.collectStatesFromSources()

      // 2. Identify conflicts
      const conflicts = this.identifyConflicts(states)

      // 3. Resolve conflicts using reconciliation strategy
      const reconciledState = await this.reconciler.reconcile(states, conflicts)

      // 4. Validate the reconciled state
      const validationResult = await this.validator.validate(reconciledState)
      if (!validationResult.isValid) {
        throw new ValidationError(validationResult.errors)
      }

      // 5. Apply reconciled state to all sources
      await this.applySyncedState(reconciledState)

      return {
        success: true,
        data: reconciledState,
        conflictsResolved: conflicts.length,
        sourcesUpdated: this.sources.map((s) => s.name),
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        fallbackData: await this.getFallbackState(),
      }
    }
  }

  private async collectStatesFromSources(): Promise<SourceState<T>[]> {
    const sourceStates: SourceState<T>[] = []

    for (const source of this.sources) {
      if (!source.isAvailable) continue

      try {
        const data = await this.loadFromSource(source)
        sourceStates.push({
          source: source.name,
          data,
          timestamp: source.lastSyncedAt,
          isStale: this.isStateStale(source),
        })
      } catch (error) {
        console.warn(`Failed to load from ${source.name}:`, error)
      }
    }

    return sourceStates
  }

  private identifyConflicts(states: SourceState<T>[]): StateConflict<T>[] {
    const conflicts: StateConflict<T>[] = []

    // Compare states pairwise to identify conflicts
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const conflict = this.compareStates(states[i], states[j])
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    return conflicts
  }
}
```

### 4. State Reconciliation Strategies

Implement different reconciliation strategies for different types of state:

```typescript
// src/shared/statemanagement/reconcilers/index.ts

export interface StateReconciler<T> {
  reconcile(states: SourceState<T>[], conflicts: StateConflict<T>[]): Promise<T>
}

// For settings and boolean flags - simple last write wins
// Settings are easily revertable and only relevant to single logged-in user
export class LastWriteWinsReconciler<T> implements StateReconciler<T> {
  async reconcile(states: SourceState<T>[]): Promise<T> {
    // Use the most recently updated state - no complex conflict resolution needed
    // Settings changes are:
    // - Easily revertable by user
    // - User-specific (no multi-user conflicts)
    // - Non-critical (unlike document content)
    return states.sort((a, b) => b.timestamp - a.timestamp)[0].data
  }
}

// For arrays and lists
export class MergeReconciler<T extends any[]> implements StateReconciler<T> {
  async reconcile(states: SourceState<T>[]): Promise<T> {
    // Merge arrays, removing duplicates by ID
    const allItems = states.flatMap((state) => state.data)
    return this.deduplicateById(allItems) as T
  }
}

// For text content (reuse existing conflict resolution)
export class TextReconciler implements StateReconciler<string> {
  async reconcile(
    states: SourceState<string>[],
    conflicts: StateConflict<string>[],
  ): Promise<string> {
    if (conflicts.length === 0) {
      return states[0].data
    }

    // Use existing three-way merge logic
    const [local, remote] = conflicts[0]
    return resolveTextConflict(conflicts[0].baseValue, local.data, remote.data)
      .mergedText
  }
}

// For structured todos specifically
export class StructuredTodosReconciler
  implements StateReconciler<StructuredTodosState>
{
  async reconcile(
    states: SourceState<StructuredTodosState>[],
  ): Promise<StructuredTodosState> {
    const mergedState: StructuredTodosState = {
      todos: [],
      enabled: false,
      apiKey: null,
      apiKeyIsSet: false,
      isProcessing: false,
      error: undefined,
    }

    // Priority: Firestore > localStorage for settings (last-write-wins)
    // Priority: Firestore ONLY for todos (cloud-generated, read-only on client)
    const firestoreState = states.find((s) => s.source === 'firestore')
    const localStorageState = states.find((s) => s.source === 'localStorage')

    // Settings reconciliation - simple last write wins for user settings
    if (firestoreState) {
      mergedState.enabled = firestoreState.data.enabled
      mergedState.apiKeyIsSet = firestoreState.data.apiKeyIsSet
    } else if (localStorageState) {
      mergedState.enabled = localStorageState.data.enabled
    }

    // Todos reconciliation - Firestore is ONLY source of truth
    // Todos are generated by Cloud Functions and cannot be modified locally
    if (firestoreState?.data.todos.length > 0) {
      mergedState.todos = firestoreState.data.todos
      mergedState.lastProcessedAt = firestoreState.data.lastProcessedAt
    } else if (localStorageState?.data.todos.length > 0) {
      // Use local cache ONLY if Firestore is unavailable (offline mode)
      mergedState.todos = localStorageState.data.todos
      mergedState.lastProcessedAt = localStorageState.data.lastProcessedAt
    }

    return mergedState
  }
}
```

### 5. Enhanced Middleware Architecture

Replace fragmented persistence middlewares with a unified system that handles all localStorage operations:

**Current fragmented approach:**

- `editorListenerMiddleware` (packages/app/src/editor/persistenceMiddleware.ts)
- `structuredTodosListenerMiddleware` (packages/app/src/structuredTodos/persistenceMiddleware.ts)
- `cloudPersistenceMiddleware` (packages/app/src/cloudsync/cloudPersistenceMiddleware.ts)
- Direct localStorage writes in `hotkeysSlice.ts` reducers
- Various ad-hoc localStorage patterns across features

**New unified approach:**

```typescript
// src/shared/statemanagement/middleware.ts

export const unifiedStateMiddleware = createListenerMiddleware()

// Feature registration - unified configuration for all persistence
const featureConfigs = new Map<string, FeatureConfig>()

interface FeatureConfig<T = any> {
  name: string
  syncManager: SyncManager<T>
  dependencyManager: DependencyManager
  selectors: {
    selectState: (state: RootState) => T
    selectSyncStatus: (state: RootState) => SyncStatus
  }
  actions: {
    setState: ActionCreator<T>
    setSyncStatus: ActionCreator<SyncStatus>
  }
}

// Register all features with localStorage persistence
featureConfigs.set('cloudSync', {
  name: 'cloudSync',
  syncManager: new SyncManager(
    'cloudSync',
    [
      { name: 'redux', priority: 3, isAvailable: true, lastSyncedAt: 0 },
      { name: 'localStorage', priority: 1, isAvailable: true, lastSyncedAt: 0 },
      { name: 'firestore', priority: 2, isAvailable: false, lastSyncedAt: 0 },
    ],
    new LastWriteWinsReconciler<CloudState>(), // Simple settings reconciliation
    new CloudStateValidator(),
  ),
  dependencyManager: new DependencyManager(store.dispatch),
  selectors: {
    selectState: (state) => state.cloud,
    selectSyncStatus: (state) => state.cloud.syncStatus,
  },
  actions: {
    setState: setCloudState,
    setSyncStatus: setCloudSyncStatus,
  },
})

// Register editor feature (replaces editorListenerMiddleware)
featureConfigs.set('editor', {
  name: 'editor',
  syncManager: new SyncManager(
    'editor',
    [
      { name: 'redux', priority: 3, isAvailable: true, lastSyncedAt: 0 },
      { name: 'localStorage', priority: 1, isAvailable: true, lastSyncedAt: 0 },
      { name: 'firestore', priority: 2, isAvailable: false, lastSyncedAt: 0 },
    ],
    new TextReconciler(), // Advanced text conflict resolution
    new EditorStateValidator(),
  ),
  dependencyManager: new DependencyManager(store.dispatch),
  // ...
})

// Register hotkeys feature (replaces direct localStorage writes)
featureConfigs.set('hotkeys', {
  name: 'hotkeys',
  syncManager: new SyncManager(
    'hotkeys',
    [
      { name: 'redux', priority: 2, isAvailable: true, lastSyncedAt: 0 },
      { name: 'localStorage', priority: 1, isAvailable: true, lastSyncedAt: 0 },
      // No Firestore - local-only
    ],
    new LastWriteWinsReconciler<HotkeysState>(), // Simple settings
    new HotkeysStateValidator(),
  ),
  dependencyManager: new DependencyManager(store.dispatch),
  // ...
})

// Unified sync listener
unifiedStateMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    return (
      isStateChangeAction(action) &&
      requiresSync(action, currentState, previousState)
    )
  },
  effect: async (action, api) => {
    const featureName = extractFeatureName(action)
    const config = featureConfigs.get(featureName)

    if (!config) return

    try {
      // Check dependencies before processing
      const dependencyCheck = config.dependencyManager.canPerformAction(action)
      if (!dependencyCheck.allowed) {
        api.dispatch(setError(featureName, dependencyCheck.reason))
        return
      }

      // Perform synchronization
      const syncResult = await config.syncManager.synchronize()

      if (syncResult.success) {
        api.dispatch(config.actions.setState(syncResult.data))
        api.dispatch(config.actions.setSyncStatus('synced'))
      } else {
        api.dispatch(setError(featureName, syncResult.error))
        api.dispatch(config.actions.setSyncStatus('error'))
      }
    } catch (error) {
      console.error(`Sync failed for ${featureName}:`, error)
      api.dispatch(setError(featureName, error.message))
    }
  },
})

// Dependency cascade listener
unifiedStateMiddleware.startListening({
  predicate: (action, currentState, previousState) => {
    return isDependencyTriggeringAction(action, currentState, previousState)
  },
  effect: async (action, api) => {
    const dependencyManager = new DependencyManager(api.dispatch)
    await dependencyManager.handleCascade(action, api.getState())
  },
})
```

## Implementation Plan

### Phase 1: Foundation

#### 1.1 Create Core Infrastructure

1. **Directory Structure**

   ```
   src/shared/
     statemanagement/
       types.ts                    # Core interfaces and types
       DependencyManager.ts        # Feature dependency management
       SyncManager.ts             # Unified synchronization logic
       reconcilers/
         index.ts                 # Reconciler interface
         LastWriteWinsReconciler.ts
         MergeReconciler.ts
         TextReconciler.ts
         StructuredTodosReconciler.ts
       validators/
         index.ts                 # Validator interface
         CloudStateValidator.ts
         StructuredTodosValidator.ts
       middleware.ts              # Unified state middleware
       utils.ts                   # Helper functions
       __tests__/
         DependencyManager.test.ts
         SyncManager.test.ts
         reconcilers.test.ts
   ```

2. **Core Types Implementation**

   ```typescript
   // Implement all interfaces defined in the design
   // Add comprehensive JSDoc documentation
   // Include type constraints and validation
   ```

3. **Basic Dependency Manager**
   ```typescript
   // Implement core dependency management logic
   // Add feature registration system
   // Include dependency validation
   ```

#### 1.2 Testing Foundation

1. **Test Infrastructure**

   ```typescript
   // Set up comprehensive test utilities
   // Create mock implementations for testing
   // Add integration test helpers
   ```

2. **Core Logic Tests**
   ```typescript
   // DependencyManager unit tests
   // SyncManager unit tests
   // Reconciler strategy tests
   ```

### Phase 2: Cloud Sync Migration

#### 2.1 Enhanced Cloud State Types

```typescript
// Update src/cloudsync/cloudSlice.ts
export interface CloudState {
  enabled: boolean
  status: CloudStatus
  user: CloudUserInfo | null
  error?: string
  // Add sync metadata
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline' | 'disabled'
  lastSyncedAt: number
  pendingChanges: Partial<CloudState>[]
  dependencies: string[] // []
  dependents: string[] // ['structuredTodos']
  // Enhanced document tracking
  docs: Record<WritingMode, CloudDocState>
}

interface CloudDocState {
  baseRev: number
  baseText: string
  hasPendingWrites: boolean
  fromCache: boolean
  lastSyncedAt: number
  conflictResolution?: ConflictResolution
}
```

#### 2.2 Cloud Sync Manager Implementation

```typescript
// Create src/cloudsync/CloudSyncManager.ts
export class CloudSyncManager extends SyncManager<CloudState> {
  constructor(dispatch: AppDispatch) {
    super(
      'cloudSync',
      [
        { name: 'redux', priority: 3, isAvailable: true, lastSyncedAt: 0 },
        {
          name: 'localStorage',
          priority: 1,
          isAvailable: true,
          lastSyncedAt: 0,
        },
        { name: 'firestore', priority: 2, isAvailable: false, lastSyncedAt: 0 },
      ],
      new CloudReconciler(),
      new CloudStateValidator(),
    )
  }

  async handleAuthStateChange(user: CloudUserInfo | null): Promise<void> {
    // Enhanced auth handling with dependency management
  }

  async handleConnectionChange(status: CloudStatus): Promise<void> {
    // Update Firestore source availability
    // Trigger dependent feature updates
  }
}
```

#### 2.3 Migration Strategy

1. **Gradual Migration**

   - Keep existing cloudPersistenceMiddleware temporarily
   - Add new middleware alongside
   - Migrate listeners one by one

2. **Backward Compatibility**

   - Maintain existing action creators
   - Preserve existing selectors
   - Keep existing component interfaces

3. **Testing During Migration**
   - Run both old and new systems in parallel
   - Compare outputs for consistency
   - Gradual cutover with feature flags

### Phase 3: Structured Todos Migration

#### 3.1 Enhanced Structured Todos State

```typescript
// Update src/structuredTodos/structuredTodosSlice.ts
export interface StructuredTodosState {
  todos: StructuredTodo[]
  enabled: boolean
  apiKey: string | null
  apiKeyIsSet: boolean
  isProcessing: boolean
  error?: string
  lastProcessedAt?: number
  // Add sync and dependency metadata
  syncStatus: 'synced' | 'pending' | 'conflict' | 'offline' | 'disabled'
  lastSyncedAt: number
  pendingChanges: Partial<StructuredTodosState>[]
  dependencies: string[] // ['cloudSync']
  dependents: string[] // []
  // Add dependency status
  canEnable: boolean
  disabledReason?: string
}
```

#### 3.2 Structured Todos Sync Manager

```typescript
// Create src/structuredTodos/StructuredTodosSyncManager.ts
export class StructuredTodosSyncManager extends SyncManager<StructuredTodosState> {
  constructor(dispatch: AppDispatch, dependencyManager: DependencyManager) {
    super(
      'structuredTodos',
      [
        { name: 'redux', priority: 3, isAvailable: true, lastSyncedAt: 0 },
        {
          name: 'localStorage',
          priority: 1,
          isAvailable: true,
          lastSyncedAt: 0,
        },
        { name: 'firestore', priority: 2, isAvailable: false, lastSyncedAt: 0 },
      ],
      new StructuredTodosReconciler(),
      new StructuredTodosValidator(dependencyManager),
    )
  }

  async handleDependencyChange(cloudSyncEnabled: boolean): Promise<void> {
    // Handle cloud sync enable/disable
    if (!cloudSyncEnabled && this.isEnabled()) {
      await this.disable('Cloud sync was disabled')
    }
  }
}
```

#### 3.3 Dependency Integration

1. **Enhanced Hooks**

   ```typescript
   // Update src/structuredTodos/hooks.ts
   export const useStructuredTodos = () => {
     const dispatch = useAppDispatch()
     const dependencyManager = useDependencyManager()

     const state = useAppSelector(selectStructuredTodosState)
     const { canEnable, disabledReason } = useAppSelector(
       selectStructuredTodosDependencyStatus,
     )

     const toggleEnabled = useCallback(
       async (value: boolean) => {
         if (value) {
           await dependencyManager.enableFeature('structuredTodos')
         } else {
           await dependencyManager.disableFeature('structuredTodos')
         }
       },
       [dependencyManager],
     )

     return {
       ...state,
       canEnable,
       disabledReason,
       toggleEnabled,
       // ... other methods
     }
   }
   ```

2. **Enhanced Selectors**

   ```typescript
   // Update src/structuredTodos/selectors.ts
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

       return {
         canEnable: true,
         disabledReason: undefined,
       }
     },
   )
   ```

### Phase 4: UI Integration

#### 4.1 Enhanced Sync Status Integration

Replace the current basic sync status display with comprehensive sync indicators:

**Current implementation in Toolbar.tsx:**

```typescript
<Button
  label={`Cloud sync (${cloudSyncStatusText})`}
  onClick={onOpenCloudSyncSettings}
/>
```

**Enhanced implementation:**

```typescript
// Update src/menu/components/Toolbar.tsx
import { SyncStatusIndicator } from '../../shared/components/SyncStatusIndicator'

const Toolbar: React.FC<Props> = ({
  onOpenCloudSyncSettings,
  // Remove cloudSyncStatusText prop - now handled by SyncStatusIndicator
}) => {
  return (
    <ToolbarContainer id="toolbar">
      {/* ... existing sections ... */}
      <SectionContainer as="nav" aria-label="Settings">
        <SectionTitle>Settings</SectionTitle>
        <Button label="General" onClick={onOpenSettings} />
        <Button label="Auto-save" onClick={onOpenAutoSaveSettings} />

        {/* Enhanced cloud sync button with sync status */}
        <Button
          onClick={onOpenCloudSyncSettings}
          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
        >
          <span>Cloud sync</span>
          <SyncStatusIndicator featureName="cloudSync" size="small" />
        </Button>

        <Button label="Shortcuts" onClick={onOpenHotkeysSettings} />
      </SectionContainer>
      {/* ... rest of component ... */}
    </ToolbarContainer>
  )
}

// Update src/menu/containers/Toolbar.tsx to remove cloudSyncStatusText logic
```

#### 4.2 Enhanced Settings Components

```typescript
// Update src/settings/components/SettingsModal.tsx
const CloudSyncSection: React.FC = () => {
  const { enabled, canDisable, disabledReason } = useCloudSync()
  const dependencyManager = useDependencyManager()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <Switch
        label="Enable Cloud Sync"
        checked={enabled}
        disabled={!canDisable}
        onChange={async (value) => {
          if (value) {
            await dependencyManager.enableFeature('cloudSync')
          } else {
            await dependencyManager.disableFeature('cloudSync')
          }
        }}
        tooltip={!canDisable ? disabledReason : undefined}
      />
      <SyncStatusIndicator featureName="cloudSync" />
    </div>
  )
}

const StructuredTodosSection: React.FC = () => {
  const { enabled, canEnable, disabledReason } = useStructuredTodos()
  const dependencyManager = useDependencyManager()

  return (
    <Switch
      label="Enable Structured Todos"
      checked={enabled}
      disabled={!canEnable}
      onChange={async (value) => {
        if (value) {
          await dependencyManager.enableFeature('structuredTodos')
        } else {
          await dependencyManager.disableFeature('structuredTodos')
        }
      }}
      tooltip={!canEnable ? disabledReason : undefined}
    />
  )
}
```

#### 4.2 Enhanced Error Handling

```typescript
// Create src/shared/components/StateErrorBoundary.tsx
export const StateErrorBoundary: React.FC<{ featureName: string }> = ({
  featureName,
  children
}) => {
  const syncStatus = useAppSelector(state => selectSyncStatus(state, featureName))
  const error = useAppSelector(state => selectSyncError(state, featureName))

  if (syncStatus === 'error' && error) {
    return (
      <ErrorDisplay
        title={`${featureName} Sync Error`}
        message={error}
        onRetry={() => dispatch(retrySyncAction(featureName))}
      />
    )
  }

  return <>{children}</>
}
```

#### 4.3 Sync Status Indicators

```typescript
// Create src/shared/components/SyncStatusIndicator.tsx
export const SyncStatusIndicator: React.FC<{
  featureName: string
  size?: 'small' | 'medium' | 'large'
}> = ({
  featureName,
  size = 'medium'
}) => {
  const syncStatus = useAppSelector(state => selectSyncStatus(state, featureName))
  const lastSyncedAt = useAppSelector(state => selectLastSyncedAt(state, featureName))
  const conflictsCount = useAppSelector(state => selectConflictsCount(state, featureName))

  const getStatusColor = (status: SyncStatus) => {
    switch (status) {
      case 'synced': return 'success'
      case 'pending': return 'warning'
      case 'conflict': return 'error'
      case 'offline': return 'neutral'
      case 'disabled': return 'muted'
      default: return 'neutral'
    }
  }

  const getStatusText = (status: SyncStatus) => {
    switch (status) {
      case 'synced': return 'Synced'
      case 'pending': return 'Syncing...'
      case 'conflict': return `${conflictsCount} conflict${conflictsCount !== 1 ? 's' : ''}`
      case 'offline': return 'Offline'
      case 'disabled': return 'Disabled'
      default: return 'Unknown'
    }
  }

  return (
    <StatusBadge
      color={getStatusColor(syncStatus)}
      size={size}
      tooltip={getSyncStatusTooltip(syncStatus, lastSyncedAt, conflictsCount)}
    >
      {getStatusText(syncStatus)}
    </StatusBadge>
  )
}
```

### Phase 5: Testing & Quality Assurance

#### 5.1 Comprehensive Test Suite

1. **Unit Tests**

   ```typescript
   // Test all new components individually
   // Mock external dependencies
   // Cover edge cases and error conditions
   ```

2. **Integration Tests**

   ```typescript
   // Test feature interactions
   // Test dependency cascades
   // Test conflict resolution scenarios
   ```

3. **End-to-End Tests**
   ```typescript
   // Test complete user workflows
   // Test offline/online scenarios
   // Test error recovery
   ```

#### 5.2 Performance Testing

1. **Sync Performance**

   - Measure sync times for different data sizes
   - Test concurrent sync operations
   - Profile memory usage during sync

2. **UI Responsiveness**
   - Test UI responsiveness during sync
   - Measure render performance
   - Test with large datasets

#### 5.3 Manual Testing Scenarios

1. **Happy Path Scenarios**

   - Enable/disable features in correct order
   - Normal sync operations
   - Conflict-free state changes

2. **Edge Case Scenarios**

   - Network interruptions during sync
   - Concurrent modifications
   - Invalid state combinations
   - Browser storage limitations

3. **Error Recovery Scenarios**
   - Authentication failures
   - Firestore permission errors
   - localStorage corruption
   - Dependency violation attempts

### Phase 6: Migration & Cleanup

#### 6.1 Complete Migration

1. **Remove Old Middleware Files**

   - `packages/app/src/cloudsync/cloudPersistenceMiddleware.ts`
   - `packages/app/src/structuredTodos/persistenceMiddleware.ts`
   - `packages/app/src/editor/persistenceMiddleware.ts`

2. **Update Store Configuration**

   ```typescript
   // src/store.ts
   export const createStore = () =>
     configureStore({
       reducer: {
         // ... existing reducers
       },
       preloadedState: {
         // Enhanced hydration with conflict resolution from all sources
         ...hydrateStateFromAllSources(),
       },
       middleware: (getDefaultMiddleware) => {
         return getDefaultMiddleware()
           .prepend(unifiedStateMiddleware.middleware) // Replaces all individual middlewares
           .prepend(storageSanitizationMiddleware.middleware)
       },
     })
   ```

3. **Refactor Direct localStorage Usage**

   - Remove localStorage writes from `hotkeysSlice.ts` reducers
   - Move to middleware-based approach for consistency
   - Update all features to use unified persistence layer

4. **Clean Up Old Code**
   - Remove unused imports
   - Remove deprecated functions
   - Update documentation
   - Remove redundant localStorage keys and hydration functions

#### 6.2 Performance Optimization

1. **Selector Optimization**

   ```typescript
   // Optimize selectors for better memoization
   // Reduce unnecessary re-renders
   // Add performance monitoring
   ```

2. **Sync Optimization**
   ```typescript
   // Implement debouncing for rapid changes
   // Add batch operations
   // Optimize conflict resolution algorithms
   ```

## Testing Strategy

Tests in this project are written using **Bun's test framework (bun:test)**. The refactoring will preserve and enhance existing tests while adding comprehensive coverage for new functionality.

### 1. Preserve and Enhance Existing Tests

**Existing test coverage to preserve:**

- `hotkeysSlice.test.ts` - localStorage persistence patterns, error handling
- `editorSlice.test.ts` - text editing and persistence
- `structuredTodosSlice.test.ts` - state management
- `cloudSlice.test.ts` - cloud sync state
- `conflictResolution.test.ts` - text merge algorithms
- Component tests for settings, menu, etc.

### 2. New Unit Tests

#### Dependency Manager Tests

```typescript
// src/shared/statemanagement/__tests__/DependencyManager.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'

describe('DependencyManager', () => {
  it('prevents enabling feature without dependencies', async () => {
    const manager = new DependencyManager(mockDispatch)

    await expect(manager.enableFeature('structuredTodos')).rejects.toThrow(
      'Cannot enable structuredTodos. Missing: cloudSync',
    )
  })

  it('cascades disable when dependency is disabled', async () => {
    const manager = new DependencyManager(mockDispatch)

    // Enable both features
    await manager.enableFeature('cloudSync')
    await manager.enableFeature('structuredTodos')

    // Disable cloud sync should cascade to structured todos
    await manager.disableFeature('cloudSync')

    expect(mockDispatch).toHaveBeenCalledWith(setStructuredTodosEnabled(false))
  })
})
```

#### Sync Manager Tests

```typescript
// src/shared/statemanagement/__tests__/SyncManager.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'

describe('SyncManager', () => {
  it('reconciles conflicts using configured strategy', async () => {
    const manager = new SyncManager(
      'test',
      mockSources,
      new LastWriteWinsReconciler(),
      new MockValidator(),
    )

    const result = await manager.synchronize()

    expect(result.success).toBe(true)
    expect(result.conflictsResolved).toBeGreaterThan(0)
  })

  // Reuse localStorage testing patterns from hotkeysSlice.test.ts
  it('handles localStorage failures gracefully', async () => {
    const originalSetItem = localStorage.setItem
    localStorage.setItem = () => {
      throw new DOMException('QuotaExceededError')
    }

    const manager = new SyncManager(
      'test',
      mockSources,
      mockReconciler,
      mockValidator,
    )

    // Should not crash when localStorage fails
    expect(async () => {
      await manager.synchronize()
    }).not.toThrow()

    localStorage.setItem = originalSetItem
  })
})
```

#### Reconciler Tests

```typescript
// src/shared/statemanagement/__tests__/reconcilers.test.ts
import { describe, it, expect } from 'bun:test'

describe('LastWriteWinsReconciler', () => {
  it('uses most recent timestamp for settings', async () => {
    const reconciler = new LastWriteWinsReconciler()
    const states = [
      { source: 'localStorage', data: { enabled: true }, timestamp: 1000 },
      { source: 'firestore', data: { enabled: false }, timestamp: 2000 },
    ]

    const result = await reconciler.reconcile(states)
    expect(result.enabled).toBe(false) // More recent wins
  })
})

describe('StructuredTodosReconciler', () => {
  it('prioritizes Firestore for settings but respects last-write-wins', async () => {
    const reconciler = new StructuredTodosReconciler()
    const states = [
      {
        source: 'localStorage',
        data: { enabled: true, todos: [] },
        timestamp: Date.now() - 1000,
      },
      {
        source: 'firestore',
        data: { enabled: false, todos: [{ id: '1', text: 'Cloud todo' }] },
        timestamp: Date.now(),
      },
    ]

    const result = await reconciler.reconcile(states)

    expect(result.enabled).toBe(false) // Firestore setting wins (last write)
    expect(result.todos).toEqual([{ id: '1', text: 'Cloud todo' }]) // Firestore todos win (cloud-generated)
  })

  it('uses localStorage todos only when Firestore unavailable', async () => {
    const reconciler = new StructuredTodosReconciler()
    const states = [
      {
        source: 'localStorage',
        data: { enabled: true, todos: [{ id: '1', text: 'Local todo' }] },
        timestamp: Date.now(),
      },
      // No Firestore state (offline)
    ]

    const result = await reconciler.reconcile(states)
    expect(result.todos).toEqual([{ id: '1', text: 'Local todo' }]) // Fallback to local cache
  })
})
```

### 3. Integration Tests

```typescript
// src/shared/statemanagement/__tests__/integration.test.ts
import { describe, it, expect, beforeEach } from 'bun:test'

describe('State Management Integration', () => {
  it('handles complete enable/disable workflow', async () => {
    const store = createTestStore()

    // Enable cloud sync
    await store.dispatch(enableCloudSync())
    expect(selectCloudEnabled(store.getState())).toBe(true)

    // Enable structured todos
    await store.dispatch(enableStructuredTodos())
    expect(selectStructuredTodosEnabled(store.getState())).toBe(true)

    // Disable cloud sync should cascade
    await store.dispatch(disableCloudSync())
    expect(selectCloudEnabled(store.getState())).toBe(false)
    expect(selectStructuredTodosEnabled(store.getState())).toBe(false)
  })

  it('preserves existing localStorage behavior from hotkeysSlice', async () => {
    // Ensure the new unified system maintains compatibility with existing patterns
    const store = createTestStore()

    // Test patterns from existing hotkeysSlice.test.ts
    store.dispatch(setHotkey({ id: 'test-key', keys: 'cmd+test' }))
    expect(store.getState().hotkeys.mappings['test-key']).toBe('cmd+test')

    store.dispatch(setDefaultHotkey({ id: 'test-key' }))
    expect(store.getState().hotkeys.mappings['test-key']).toBeUndefined()
  })

  it('preserves existing editor persistence behavior', async () => {
    // Ensure text editing and auto-save continue to work as before
    const store = createTestStore()

    store.dispatch(
      setText({ mode: 'editor', text: 'Test content', cursorPos: 12 }),
    )
    store.dispatch(toggleAutoSave())

    // Verify state matches existing behavior
    expect(store.getState().editor.documents.editor.text).toBe('Test content')
    expect(store.getState().editor.autoSave).toBe(true)
  })
})
```

### 4. Component Tests

```typescript
// src/settings/__tests__/SettingsModal.test.ts
import { describe, it, expect } from 'bun:test'
import { render, screen } from '@testing-library/react'

describe('Settings Modal with Dependencies', () => {
  it('disables structured todos toggle when cloud sync is off', () => {
    const store = createTestStore({
      cloud: { enabled: false },
      structuredTodos: { enabled: false }
    })

    render(<SettingsModal />, { store })

    const structuredTodosToggle = screen.getByLabelText('Enable Structured Todos')
    expect(structuredTodosToggle).toBeDisabled()
  })

  it('shows sync status indicators correctly', () => {
    const store = createTestStore({
      cloud: { enabled: true, syncStatus: 'synced' },
    })

    render(<SettingsModal />, { store })

    const syncIndicator = screen.getByText('Synced')
    expect(syncIndicator).toBeInTheDocument()
  })
})

// src/menu/__tests__/Toolbar.test.ts
describe('Toolbar with Enhanced Sync Status', () => {
  it('displays sync status indicator instead of text', () => {
    const store = createTestStore({
      cloud: { enabled: true, syncStatus: 'pending' }
    })

    render(<Toolbar onOpenCloudSyncSettings={() => {}} />, { store })

    // Should show indicator, not old text-based status
    expect(screen.queryByText(/Cloud sync \(/)).not.toBeInTheDocument()
    expect(screen.getByText('Syncing...')).toBeInTheDocument()
  })
})
```

## Quality Checks

### 1. Type Checking

```bash
bun run typecheck
```

- Verify all new interfaces are properly typed
- Check generic type constraints
- Validate Redux state typing

### 2. Linting

```bash
bun run lint
```

- Ensure consistent code style
- Follow project conventions
- No linting violations

### 3. Testing

```bash
bun run test
```

- All existing tests continue to pass
- New tests achieve >90% coverage
- Integration tests pass

### 4. Performance Validation

- Sync operations complete within acceptable time limits
- UI remains responsive during sync
- Memory usage stays within bounds

## Migration Risk Assessment

### High Risk Areas

1. **Data Loss Prevention**

   - Backup existing localStorage data before migration
   - Implement rollback mechanisms
   - Test data recovery scenarios

2. **Authentication Disruption**

   - Preserve existing auth sessions during migration
   - Handle auth state transitions carefully
   - Test edge cases with authentication

3. **Dependency Violations**
   - Audit existing user configurations
   - Handle invalid states gracefully
   - Provide clear upgrade paths

### Mitigation Strategies

1. **Gradual Rollout**

   - Feature flags for new vs old system
   - A/B testing with subset of users
   - Easy rollback mechanism

2. **Monitoring & Alerting**

   - Track sync success rates
   - Monitor error frequencies
   - Alert on dependency violations

3. **User Communication**
   - Clear documentation of changes
   - Migration guide for users
   - Support for edge cases

## Success Metrics

### Technical Metrics

1. **Reliability**

   - Sync success rate >99%
   - Conflict resolution success rate >95%
   - Zero data loss incidents

2. **Performance**

   - Sync operations <2s for typical data sizes
   - UI response time <100ms
   - Memory usage increase <10%

3. **Maintainability**
   - Code complexity reduction
   - Test coverage >90%
   - Documentation completeness

### User Experience Metrics

1. **Usability**

   - Dependency violations prevented
   - Clear error messages
   - Intuitive state transitions

2. **Reliability**
   - Fewer sync-related support tickets
   - Improved offline/online experience
   - Better conflict resolution UX

## Future Considerations

### 1. Additional Features

1. **Advanced Reconciliation**

   - User-guided conflict resolution
   - Custom reconciliation strategies
   - Conflict history tracking

2. **Enhanced Monitoring**

   - Real-time sync status dashboard
   - Performance analytics
   - Error trend analysis

3. **Extensibility**
   - Plugin system for new reconcilers
   - Custom dependency rules
   - Third-party state sources

### 2. Performance Optimizations

1. **Intelligent Syncing**

   - Delta sync for large datasets
   - Predictive preloading
   - Background sync optimization

2. **Caching Improvements**
   - Multi-level caching strategy
   - Cache invalidation optimization
   - Compression for large states

### 3. Developer Experience

1. **Debugging Tools**

   - State sync debugger
   - Dependency graph visualizer
   - Conflict resolution tracer

2. **Testing Utilities**
   - Sync simulation tools
   - Conflict injection utilities
   - Performance testing framework

This comprehensive refactoring will establish a robust, maintainable state management system that properly handles multiple sources of truth while enforcing feature dependencies consistently throughout the application.

## ⚠️ Implementation Requirements

**CRITICAL**: This refactoring plan requires careful manual review:

1. **Manual Review Required**: After the full implementation, don't commit the changes, the developer will review the changes and commit them.

The complexity of this refactoring across multiple interconnected systems (localStorage, Redux, Firestore, UI components) requires human oversight to ensure data integrity and system stability.
