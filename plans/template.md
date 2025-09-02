# Content Sanitization Design

## Overview

This document outlines the design for consolidating all content sanitization logic in the editor into a single, maintainable system using Redux Toolkit's listener middleware. The goal is to decouple sanitization from UI components and ensure consistent text handling throughout the application.

## Current State

Currently, sanitization logic is spread across multiple locations and operates at different stages:

### Storage Stage (Writing to Store)

1. `stripVisualIndents`: Removes visual indentation before storing text
2. `computeListEnter`: Processes list-related text transformations
3. (Proposed) Character cleaning for problematic Unicode characters

### Presentation Stage (Reading from Store)

1. `injectVisualIndents`: Adds visual indentation for display purposes
2. Other display-specific transformations

Issues with current approach:

- Sanitization logic is tightly coupled with UI components
- Multiple places where text transformations occur
- No clear separation between storage and presentation sanitization
- Difficult to test and maintain sanitization rules
- Risk of applying wrong sanitization at wrong stage

## Proposed Solution

### 1. Core Architecture

Create a new middleware-based sanitization system:

```typescript
// src/editor/sanitization/types.ts
export interface SanitizationResult {
  text: string
  cursorPos: number
}

export interface SanitizationContext {
  originalText: string
  originalCursorPos: number
  mode: WritingMode
}
```

### 2. Two-Stage Sanitization System

The system is split into two distinct stages with different responsibilities:

```typescript
// src/editor/sanitization/types.ts
export interface StorageSanitizer {
  name: string
  sanitize(text: string, context: StorageContext): SanitizationResult
}

export interface PresentationSanitizer {
  name: string
  transform(text: string, context: PresentationContext): TransformResult
}

// Storage sanitizers clean data before storing
export const characterSanitizer: StorageSanitizer = {
  name: 'characterCleaner',
  sanitize: (text, context) => {
    // Clean problematic Unicode characters
    // This runs BEFORE storing in Redux
  },
}

// Presentation sanitizers transform data for display
export const visualIndentSanitizer: PresentationSanitizer = {
  name: 'visualIndent',
  transform: (text, context) => {
    // Add visual indentation for display
    // This runs when SELECTING from Redux
  },
}
```

### 3. Implementation Architecture

#### Storage Stage (Redux Middleware)

```typescript
// src/editor/sanitization/middleware.ts
import { createListenerMiddleware } from '@reduxjs/toolkit'

export const storageSanitizationMiddleware = createListenerMiddleware()

// Intercept setText actions before they reach the store
storageSanitizationMiddleware.startListening({
  actionCreator: setText,
  effect: async (action, listenerApi) => {
    const result = await storagePipeline.sanitize(action.payload)
    listenerApi.dispatch(setTextInternal(result))
  },
})
```

#### Presentation Stage (Redux Selectors)

```typescript
// src/editor/sanitization/selectors.ts
import { createSelector } from '@reduxjs/toolkit'

export const selectDisplayText = createSelector(
  [(state) => state.editor.documents[state.mode].text],
  (text) => presentationPipeline.transform(text),
)
```

### 4. Character Sanitizer Implementation

The character sanitizer is a critical storage-stage sanitizer that handles problematic Unicode characters that can cause issues in browser environments, particularly with line handling and visual indentation.

#### Character Sanitizer Specification

```typescript
// src/editor/sanitization/storage/sanitizers/characterSanitizer.ts

const REPLACEMENTS: [RegExp | string, string][] = [
  // Line Separator Characters
  [/\u2028|\u2029/g, '\n'], // Replace line/paragraph separators with regular newlines
  // \u2028: Line Separator
  // \u2029: Paragraph Separator

  // Zero-Width Characters
  [/[\u200B\u200C\u200D\uFEFF]/g, ''], // Remove zero-width spaces and BOM
  // \u200B: Zero-width space
  // \u200C: Zero-width non-joiner
  // \u200D: Zero-width joiner
  // \uFEFF: Byte Order Mark

  // Whitespace Normalization
  [/\u00A0/g, ' '], // Replace non-breaking space with regular space
  [/\r\n?/g, '\n'], // Normalize Windows/old Mac line endings to \n
]

export const characterSanitizer: StorageSanitizer = {
  name: 'characterCleaner',
  sanitize: (text: string, context: StorageContext): SanitizationResult => {
    if (!text) return { text, cursorPos: context.originalCursorPos }

    let adjustedCursorPos = context.originalCursorPos
    let cleanedValue = text

    for (const [pattern, replacement] of REPLACEMENTS) {
      // For each replacement, we need to:
      // 1. Count how many matches occur before the cursor
      // 2. Calculate how the cursor position changes based on those replacements
      const regex =
        pattern instanceof RegExp ? pattern : new RegExp(pattern, 'g')
      let match

      while ((match = regex.exec(cleanedValue)) !== null) {
        const matchLength = match[0].length
        const replacementLength = replacement.length

        // If the match occurs before the cursor, adjust the cursor position
        if (match.index < adjustedCursorPos) {
          adjustedCursorPos += replacementLength - matchLength
        }
      }

      // Apply the actual replacement
      cleanedValue = cleanedValue.replace(regex, replacement)
    }

    return {
      text: cleanedValue,
      cursorPos: Math.max(0, Math.min(adjustedCursorPos, cleanedValue.length)),
    }
  },
}
```

#### Character Sanitizer Tests

```typescript
// src/editor/sanitization/storage/sanitizers/__tests__/characterSanitizer.test.ts

describe('characterSanitizer', () => {
  const context = { originalCursorPos: 0, mode: 'editor' as const }

  it('handles line separator characters', () => {
    const input = 'Line 1\u2028Line 2\u2029Line 3'
    const expected = 'Line 1\nLine 2\nLine 3'
    expect(characterSanitizer.sanitize(input, context).text).toBe(expected)
  })

  it('removes zero-width spaces', () => {
    const input = 'Hello\u200BWorld\u200C!\u200D'
    const expected = 'HelloWorld!'
    expect(characterSanitizer.sanitize(input, context).text).toBe(expected)
  })

  it('normalizes whitespace', () => {
    const input = 'Text with\u00A0nbsp\r\nand\rCRLF'
    const expected = 'Text with nbsp\nand\nCRLF'
    expect(characterSanitizer.sanitize(input, context).text).toBe(expected)
  })

  it('maintains cursor position after basic replacement', () => {
    const input = 'Hello\u2028World'
    const result = characterSanitizer.sanitize(input, {
      ...context,
      originalCursorPos: 7,
    })
    expect(result.cursorPos).toBe(6) // Cursor adjusts for shorter replacement
  })

  it('handles multiple replacements before cursor', () => {
    const input = '\u200B\u200BHello\u2028World'
    const result = characterSanitizer.sanitize(input, {
      ...context,
      originalCursorPos: 8,
    })
    expect(result.cursorPos).toBe(6) // Cursor adjusts for all replacements
  })

  it('handles empty input', () => {
    const result = characterSanitizer.sanitize('', context)
    expect(result.text).toBe('')
    expect(result.cursorPos).toBe(0)
  })
})
```

### 5. Implementation Steps

1. Create new directory structure:

```
src/editor/
  sanitization/
    storage/
      sanitizers/
        characterSanitizer.ts
        listEnterSanitizer.ts
        index.ts
      pipeline.ts
      middleware.ts
    presentation/
      transformers/
        visualIndentTransformer.ts
        index.ts
      pipeline.ts
      selectors.ts
    types.ts
    index.ts
```

2. Move existing sanitization logic:

   - Extract visual indent logic from components
   - Move list enter processing to sanitizer
   - Implement character cleaning sanitizer

3. Update editor slice:

   - Split setText action into public and internal versions
   - Remove direct sanitization from reducers
   - Add middleware to store configuration

4. Update components:
   - Remove sanitization logic from MarkdownEditor
   - Update to use new actions
   - Keep only UI-specific logic in components

### 5. Testing Strategy

The testing strategy needs to maintain and extend the existing comprehensive test coverage while adding new tests for the sanitization system.

#### Existing Tests to Preserve

1. Editor slice tests (`editorSlice.test.ts`)

   - Basic text operations (setText, clear, load)
   - Unicode character handling
   - Cursor position management
   - Multiple document operations
   - Rapid consecutive operations

2. Visual indent tests (`visualIndent.test.ts`)

   - Stripping and injecting indentation
   - Cursor position adjustments
   - Edge cases and special characters

3. List enter tests (`computeListEnter.test.ts`)
   - List item handling
   - Cursor positioning
   - Various list formats

#### New Tests Required

1. Storage Stage Tests:

```typescript
// src/editor/sanitization/storage/__tests__/pipeline.test.ts
describe('Storage Sanitization Pipeline', () => {
  it('cleans problematic characters before storage', () => {})
  it('maintains cursor position after cleaning', () => {})
  it('processes sanitizers in correct order', () => {})
  it('handles empty text correctly', () => {})
})
```

2. Presentation Stage Tests:

```typescript
// src/editor/sanitization/presentation/__tests__/pipeline.test.ts
describe('Presentation Transform Pipeline', () => {
  it('applies visual transformations correctly', () => {})
  it('handles cursor positions in transformed text', () => {})
  it('processes transformers in correct order', () => {})
})
```

3. Integration Tests:

```typescript
// src/editor/sanitization/__tests__/integration.test.ts
describe('Sanitization Integration', () => {
  it('correctly handles text from input to display', () => {})
  it('preserves cursor through entire pipeline', () => {})
  it('maintains list formatting through storage and display', () => {})
})
```

### 6. Quality Checks

Before merging any changes, ensure all quality checks pass:

1. **Type Checking**

   ```bash
   bun run typecheck
   ```

   - Verify no new type errors are introduced
   - Ensure proper typing of sanitization interfaces
   - Check generic type constraints

2. **Linting**

   ```bash
   bun run lint
   ```

   - Maintain consistent code style
   - Follow project conventions
   - Check for potential issues

3. **Testing**

   ```bash
   bun run test
   ```

   - All existing tests must pass
   - New tests must have good coverage
   - Test both success and error cases

4. **Manual Testing Checklist**
   - [ ] Test with various input methods (type, paste, load)
   - [ ] Verify cursor behavior in all scenarios
   - [ ] Check list formatting and indentation
   - [ ] Test with Unicode and special characters
   - [ ] Verify performance with large documents

## Benefits

1. **Separation of Concerns**

   - UI components focus on presentation
   - Sanitization logic is centralized
   - Clear data flow through the application

2. **Maintainability**

   - Single location for all text processing
   - Easy to add/modify sanitization rules
   - Clear testing boundaries

3. **Performance**

   - Optimized processing order
   - Reduced component re-renders
   - Better caching opportunities

4. **Extensibility**
   - Easy to add new sanitizers
   - Pipeline can be conditionally configured
   - Clear interface for future enhancements

## Migration Plan

1. Phase 1: Setup Infrastructure

   - Create directory structure
   - Implement basic pipeline
   - Add middleware configuration

2. Phase 2: Migrate Existing Logic

   - Move visual indent sanitizer
   - Move list enter sanitizer
   - Add character cleaning sanitizer

3. Phase 3: Update Components

   - Remove old sanitization code
   - Update to use new actions
   - Add tests for new structure

4. Phase 4: Cleanup & Documentation
   - Remove unused code
   - Update documentation
   - Add monitoring/logging

## Future Considerations

1. **Performance Optimization**

   - Memoization of sanitization results
   - Selective sanitization based on content type
   - Batch processing for large documents

2. **Extended Features**

   - Configurable sanitization rules
   - Mode-specific sanitization
   - Undo/redo support for sanitization

3. **Monitoring**
   - Performance metrics
   - Error tracking
   - Usage analytics
