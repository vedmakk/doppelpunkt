# Destructive Shortcuts Design

## Overview

This document extends the [destructive-action.md](./destructive-action.md) plan to cover keyboard shortcuts (hotkeys) that trigger destructive actions. Currently, while destructive buttons show confirmation dialogs, their corresponding hotkeys bypass these confirmations, creating an inconsistent and potentially dangerous user experience.

## Current Problem

### Inconsistent Destructive Action Handling

In `ToolbarEditorSection.tsx`, we have both:

**Destructive Button with Confirmation:**

```typescript
<DestructiveButton
  label="New"
  onClick={onNew}
  confirmationTitle="Create New Document"
  confirmationMessage="Discard current content and create a new document? Any unsaved changes will be lost."
  confirmButtonLabel="Create New"
  cancelButtonLabel="Keep Current"
  requiresCondition={() => Boolean(content)}
/>
```

**Hotkey without Confirmation:**

```typescript
useCustomHotkey(HotkeyId.NewDocument, onNew) // Bypasses confirmation!
```

### Risk Analysis

This creates several problems:

1. **Accidental Data Loss**: Users can accidentally trigger `Ctrl+Shift+N` and lose unsaved content
2. **Inconsistent UX**: Same action behaves differently via button vs. hotkey
3. **Accessibility Issues**: Screen reader users may not understand the risk difference
4. **Training Confusion**: Users learn to expect confirmations but hotkeys don't provide them

### Current Destructive Actions with Hotkeys

Based on the codebase analysis:

| Action        | Button       | Hotkey    | Current Status   |
| ------------- | ------------ | --------- | ---------------- |
| New Document  | ✅ Confirmed | ❌ Direct | **INCONSISTENT** |
| Open Document | ✅ Confirmed | ❌ Direct | **INCONSISTENT** |

## Proposed Solution

### 1. Architecture Overview

Create a unified destructive action system that handles both buttons and hotkeys consistently through:

1. **`useDestructiveAction` Hook**: Core logic for destructive actions
2. **`useDestructiveHotkey` Hook**: Hotkey-specific wrapper that uses destructive action logic
3. **Shared Configuration**: Common destructive action definitions
4. **Backward Compatibility**: Existing `DestructiveButton` continues to work

### 2. Core Architecture

#### DestructiveActionConfig Interface

```typescript
// src/destructive-actions/types.ts
export enum DestructiveActionId {
  NewDocument = 'newDocument',
  OpenDocument = 'openDocument',
  DeleteAccount = 'deleteAccount',
  ClearApiKey = 'clearApiKey',
}

export interface DestructiveActionConfig {
  id: DestructiveActionId
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  requiresCondition?: () => boolean
}
```

#### useDestructiveAction Hook

```typescript
// src/destructive-actions/hooks/useDestructiveAction.ts
import { DESTRUCTIVE_ACTION_CONFIGS, DestructiveActionId } from '../config'

export interface UseDestructiveActionOptions {
  configId: DestructiveActionId
  onAction: (e?: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) => void
  requiresCondition?: () => boolean // Optional override
}

export const useDestructiveAction = ({
  configId,
  onAction,
  requiresCondition,
}: UseDestructiveActionOptions) => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[configId]
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false)
  const [shouldRenderConfirmation, setShouldRenderConfirmation] =
    useState(false)

  const executeAction = useCallback(
    (e?: React.MouseEvent<HTMLButtonElement> | KeyboardEvent) => {
      // Check if confirmation is needed
      const conditionCheck = requiresCondition || config.requiresCondition
      const needsConfirmation = conditionCheck ? conditionCheck() : true

      if (needsConfirmation) {
        setShouldRenderConfirmation(true)
        setIsConfirmationOpen(true)
      } else {
        onAction(e)
      }
    },
    [config, onAction],
  )

  const handleConfirm = useCallback(() => {
    setIsConfirmationOpen(false)
    onAction()
  }, [onAction])

  const handleCancel = useCallback(() => {
    setIsConfirmationOpen(false)
  }, [])

  return {
    executeAction,
    confirmationProps: {
      isOpen: isConfirmationOpen,
      shouldRender: shouldRenderConfirmation,
      onClose: handleCancel,
      setShouldRender: setShouldRenderConfirmation,
      title: config.title || 'Confirm Action',
      message: config.message,
      confirmLabel: config.confirmLabel || 'Confirm',
      cancelLabel: config.cancelLabel || 'Cancel',
      onConfirm: handleConfirm,
      destructive: true,
    },
  }
}
```

#### useDestructiveHotkey Hook

```typescript
// src/hotkeys/hooks.ts (extend existing file)
import { getHotkey } from './registry'

export const useDestructiveHotkey = (
  id: HotkeyId,
  onAction: (e?: KeyboardEvent) => void,
  requiresCondition?: () => boolean,
) => {
  const hotkey = getHotkey(id)

  // Only proceed if this hotkey is marked as destructive
  if (!hotkey.destructive) {
    throw new Error(`Hotkey ${id} is not marked as destructive`)
  }

  const { executeAction, confirmationProps } = useDestructiveAction({
    configId: hotkey.destructive,
    onAction,
    requiresCondition,
  })

  // Use existing hotkey system but with our destructive action handler
  useCustomHotkey(id, executeAction)

  return {
    confirmationProps,
  }
}
```

### 3. Implementation Strategy

#### Phase 1: Create Core Infrastructure

1. **Create shared types and configurations**

```typescript
// src/destructive-actions/config.ts
export enum DestructiveActionId {
  NewDocument = 'newDocument',
  OpenDocument = 'openDocument',
  DeleteAccount = 'deleteAccount',
  ClearApiKey = 'clearApiKey',
}

export interface DestructiveActionConfig {
  id: DestructiveActionId
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  requiresCondition?: () => boolean
}

export const DESTRUCTIVE_ACTION_CONFIGS: Record<
  DestructiveActionId,
  DestructiveActionConfig
> = {
  [DestructiveActionId.NewDocument]: {
    id: DestructiveActionId.NewDocument,
    title: 'Create New Document',
    message:
      'Discard current content and create a new document? Any unsaved changes will be lost.',
    confirmLabel: 'Create New',
    cancelLabel: 'Keep Current',
  },
  [DestructiveActionId.OpenDocument]: {
    id: DestructiveActionId.OpenDocument,
    title: 'Open Document',
    message:
      'Discard current content and open a new file? Any unsaved changes will be lost.',
    confirmLabel: 'Open File',
    cancelLabel: 'Keep Current',
  },
  [DestructiveActionId.DeleteAccount]: {
    id: DestructiveActionId.DeleteAccount,
    title: 'Delete Account',
    message:
      'Are you sure you want to delete your account? This action cannot be undone and will permanently remove all your data.',
    confirmLabel: 'Delete Account',
    cancelLabel: 'Cancel',
  },
  [DestructiveActionId.ClearApiKey]: {
    id: DestructiveActionId.ClearApiKey,
    title: 'Clear API Key',
    message:
      'Are you sure you want to clear the API key? You will need to re-enter it to use structured todos.',
    confirmLabel: 'Clear Key',
    cancelLabel: 'Cancel',
  },
}

export const getDestructiveActionConfig = (
  id: DestructiveActionId,
): DestructiveActionConfig => {
  const config = DESTRUCTIVE_ACTION_CONFIGS[id]
  if (!config) {
    throw new Error(`Destructive action config ${id} not found`)
  }
  return config
}
```

2. **Implement `useDestructiveAction` hook**

3. **Implement `useDestructiveHotkey` hook**

#### Phase 2: Update DestructiveButton to use new system

```typescript
// src/destructive-actions/components/DestructiveButton.tsx (refactored)
import { DestructiveActionId } from '../types'
import { useDestructiveAction } from '../hooks/useDestructiveAction'

interface DestructiveButtonProps {
  label: string
  configId: DestructiveActionId
  onClick: (e?: React.MouseEvent<HTMLButtonElement>) => void
  requiresCondition?: () => boolean
  disabled?: boolean
  href?: string
  externalLink?: boolean
  active?: boolean
}

export const DestructiveButton: React.FC<DestructiveButtonProps> = ({
  label,
  configId,
  onClick,
  requiresCondition,
  ...buttonProps
}) => {
  const { executeAction, confirmationProps } = useDestructiveAction({
    configId,
    onAction: onClick,
    requiresCondition,
  })

  return (
    <>
      <Button
        {...buttonProps}
        label={label}
        onClick={executeAction}
      />
      <ConfirmationModal {...confirmationProps} />
    </>
  )
}
```

#### Phase 3: Update Components to use new system

1. **Update ToolbarEditorSection**

```typescript
// Before
useCustomHotkey(HotkeyId.NewDocument, onNew)
useCustomHotkey(HotkeyId.OpenDocument, handleOpen)

<DestructiveButton
  label="New"
  onClick={onNew}
  confirmationTitle="Create New Document"
  confirmationMessage="Discard current content and create a new document? Any unsaved changes will be lost."
  confirmButtonLabel="Create New"
  cancelButtonLabel="Keep Current"
  requiresCondition={() => Boolean(content)}
/>

// After
const { confirmationProps: newConfirmationProps } = useDestructiveHotkey(
  HotkeyId.NewDocument,
  onNew,
  () => Boolean(content)
)

const { confirmationProps: openConfirmationProps } = useDestructiveHotkey(
  HotkeyId.OpenDocument,
  handleOpen,
  () => Boolean(content)
)

// Buttons use config ID
<DestructiveButton
  label="New"
  configId={DestructiveActionId.NewDocument}
  onClick={onNew}
  requiresCondition={() => Boolean(content)}
/>

<DestructiveButton
  label="Open"
  configId={DestructiveActionId.OpenDocument}
  onClick={handleOpen}
  requiresCondition={() => Boolean(content)}
/>

// Render confirmation modals for hotkeys
<ConfirmationModal {...newConfirmationProps} />
<ConfirmationModal {...openConfirmationProps} />
```

2. **Update SettingsModal**

```typescript
// Update existing DestructiveButton components to use new config-based approach
<DestructiveButton
  label="Delete account"
  configId={DestructiveActionId.DeleteAccount}
  onClick={onDeleteUser}
/>

<DestructiveButton
  label="Clear Key"
  configId={DestructiveActionId.ClearApiKey}
  onClick={handleApiKeyClear}
/>
```

### 4. Advanced Features

#### Registry Integration

Extend the hotkey registry to mark destructive actions:

```typescript
// src/hotkeys/registry.ts (extended)
export interface HotkeyDefinition {
  id: HotkeyId
  label: string
  description: string
  defaultKeys: string
  scope: HotkeyScope
  destructive?: DestructiveActionId | false // New field: either false or destructive action ID
}

export const hotkeys: HotkeyDefinition[] = [
  {
    id: HotkeyId.NewDocument,
    label: 'New Document',
    description: 'Create a new document.',
    defaultKeys: 'ctrl+shift+n',
    scope: HotkeyScope.Editor,
    destructive: DestructiveActionId.NewDocument,
  },
  {
    id: HotkeyId.OpenDocument,
    label: 'Open Document',
    description: 'Open a document from the file system.',
    defaultKeys: 'ctrl+shift+o',
    scope: HotkeyScope.Editor,
    destructive: DestructiveActionId.OpenDocument,
  },
  // Non-destructive actions remain unchanged
  {
    id: HotkeyId.ToggleCaptureTab,
    label: 'Tab Capture',
    description: 'Toggle capturing the Tab key in the editor.',
    defaultKeys: 'ctrl+shift+l',
    scope: HotkeyScope.Editor,
    destructive: false,
  },
]
```

### 5. Testing Strategy

#### Unit Tests

1. **useDestructiveAction Hook Tests**

```typescript
// src/destructive-actions/hooks/useDestructiveAction.test.ts
describe('useDestructiveAction', () => {
  it('executes action immediately when no condition required', () => {})
  it('shows confirmation when condition is met', () => {})
  it('skips confirmation when condition is not met', () => {})
  it('executes action after confirmation', () => {})
  it('cancels action when confirmation is cancelled', () => {})
  it('handles keyboard and mouse events correctly', () => {})
})
```

2. **useDestructiveHotkey Hook Tests**

```typescript
// src/destructive-actions/hooks/useDestructiveHotkey.test.ts
describe('useDestructiveHotkey', () => {
  it('registers hotkey with destructive action handler', () => {})
  it('shows confirmation modal when hotkey is triggered', () => {})
  it('executes action after hotkey confirmation', () => {})
  it('handles condition-based confirmation for hotkeys', () => {})
})
```

#### Integration Tests

1. **Component Integration Tests**

```typescript
// Test ToolbarEditorSection with destructive hotkeys
describe('ToolbarEditorSection with Destructive Hotkeys', () => {
  it('shows same confirmation for button click and hotkey', () => {})
  it('handles multiple confirmation modals correctly', () => {})
  it('maintains consistent behavior between button and hotkey', () => {})
})
```

#### Accessibility Tests

1. **Focus Management**: Ensure hotkey-triggered modals handle focus correctly
2. **Screen Reader Support**: Verify confirmation modals are announced properly
3. **Keyboard Navigation**: Test modal navigation with keyboard-only interaction

### 6. Migration Strategy

#### Backward Compatibility

The new system maintains full backward compatibility:

1. **Existing `DestructiveButton` components continue to work unchanged**
2. **Existing `useCustomHotkey` calls continue to work for non-destructive actions**
3. **Migration can be done incrementally, component by component**

#### Migration Steps

1. **Phase 1**: Implement core infrastructure (hooks, types, configs)
2. **Phase 2**: Update `DestructiveButton` to use new system internally
3. **Phase 3**: Migrate `ToolbarEditorSection` to use destructive hotkeys
4. **Phase 4**: Migrate other components as needed
5. **Phase 5**: Add destructive hotkeys for additional actions (like delete account)

### 7. Implementation Steps

#### Step 1: Core Infrastructure (2-3 hours)

1. **Create destructive-actions feature directory structure**

   ```
   src/destructive-actions/
   ├── components/
   │   ├── DestructiveButton.tsx
   │   └── ConfirmationModal.tsx (move from app/components)
   ├── hooks/
   │   ├── useDestructiveAction.ts
   │   └── useDestructiveHotkey.ts
   ├── config.ts
   ├── types.ts
   ```

2. **Create shared types and configurations**

   - `src/destructive-actions/types.ts`
   - `src/destructive-actions/config.ts`
   - Define `DestructiveActionConfig` interface
   - Create `DESTRUCTIVE_ACTION_CONFIGS` object

3. **Implement `useDestructiveAction` hook**

   - `src/destructive-actions/hooks/useDestructiveAction.ts`
   - Handle confirmation logic
   - Return execution handler and modal props

4. **Implement `useDestructiveHotkey` hook**
   - `src/destructive-actions/hooks/useDestructiveHotkey.ts`
   - Integrate with existing hotkey system
   - Handle keyboard-specific concerns

#### Step 2: Move and Update Components (1-2 hours)

1. **Move components to destructive-actions directory**

   - Move `DestructiveButton.tsx` from `src/app/components/`
   - Move `ConfirmationModal.tsx` from `src/app/components/`
   - Update all imports throughout the codebase

2. **Refactor `DestructiveButton` to use new hook**

   - Update to use new `configId` prop
   - Use `useDestructiveAction` internally
   - Maintain backward compatibility during transition

3. **Move and update tests**

   - Move `DestructiveButton.test.tsx` to `src/destructive-actions/components/`
   - Move `ConfirmationModal.test.tsx` to `src/destructive-actions/components/`
   - Update test imports and ensure all tests pass

4. **Update existing DestructiveButton stories to use new configId prop**

#### Step 3: Update Components to Use New System (1-2 hours)

1. **Update ToolbarEditorSection**

   - Replace direct `useCustomHotkey` calls with `useDestructiveHotkey`
   - Update DestructiveButton imports and props
   - Add confirmation modals for hotkeys
   - Update component tests

2. **Update SettingsModal**

   - Update DestructiveButton imports and props
   - Update component tests

3. **Update all other components using DestructiveButton**
   - Search and update all imports
   - Update props to use new `configId` approach

#### Step 4: Testing and Documentation (1-2 hours)

1. **Create comprehensive tests for new hooks**

   - `src/destructive-actions/hooks/useDestructiveAction.test.ts`
   - `src/destructive-actions/hooks/useDestructiveHotkey.test.ts`

2. **Update Ladle stories**

   - Move stories to `src/destructive-actions/stories/`
   - Update to use new configId prop
   - Add stories demonstrating hotkey integration

3. **Create barrel exports**

   - `src/destructive-actions/index.ts` for clean imports
   - Export all public APIs

4. **Update documentation and README**

#### Step 5: Quality Assurance (30 minutes)

1. **Run all quality checks (lint, typecheck, test)**
2. **Manual testing of hotkey + button consistency**
3. **Accessibility testing**

### 8. Benefits

#### User Experience

- **Consistent Behavior**: Same action behaves identically via button or hotkey
- **Prevent Data Loss**: Accidental hotkey presses won't lose work
- **Clear Communication**: Users understand the consequences of their actions
- **Accessibility**: Screen reader users get consistent experience

#### Developer Experience

- **Centralized Logic**: Destructive action logic in one place
- **Easy to Use**: Simple hooks for both buttons and hotkeys
- **Type Safety**: Full TypeScript support with shared configurations
- **Testable**: Clear separation of concerns makes testing easier

#### Maintainability

- **DRY Principle**: No duplication of confirmation logic
- **Consistent Patterns**: Same approach for all destructive actions
- **Extensible**: Easy to add new destructive actions
- **Backward Compatible**: Existing code continues to work

## Implementation Status

🚧 **PLANNED** - Ready for implementation

This design document provides a complete plan for extending the destructive actions system to cover keyboard shortcuts, ensuring consistent user experience across all interaction methods.

## Success Criteria

1. **Consistency** ✅ Planned

   - Same confirmation behavior for buttons and hotkeys
   - Shared configuration between interaction methods
   - Unified user experience

2. **Safety** ✅ Planned

   - No accidental data loss from hotkey presses
   - Clear communication of action consequences
   - Condition-based confirmations work for both buttons and hotkeys

3. **Developer Experience** ✅ Planned

   - Simple, reusable hooks
   - Type-safe configuration system
   - Easy testing and maintenance

4. **Backward Compatibility** ✅ Planned

   - Existing components continue to work
   - Incremental migration path
   - No breaking changes

5. **Performance** ✅ Planned
   - No performance regressions
   - Efficient modal management
   - Minimal re-renders
