# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Doppelpunkt is a minimalist, distraction-free Markdown editor web app. It features live syntax-aware rendering, a todo document mode, optional cloud sync via Firebase, and AI-powered structured todo extraction using OpenAI.

## Commands

```bash
# Install dependencies
bun install

# Start development server (app)
bun run --filter app dev

# Run tests (all packages)
bun run test

# Run single test file
bun test packages/app/src/path/to/file.test.ts

# Typecheck all packages
bun run typecheck

# Lint all packages
bun run lint

# Build all packages
bun run build

# Firebase emulators (for local cloud sync testing)
firebase emulators:start
VITE_USE_FIREBASE_EMULATOR=true bun run --filter app dev
```

## Architecture

### Monorepo Structure

- `packages/app` - React frontend (Vite, Redux Toolkit, Emotion)
- `packages/functions` - Firebase Cloud Functions (Node 22, OpenAI integration)

### Frontend State (Redux Toolkit)

The app uses Redux Toolkit with feature-based slices in `packages/app/src/`:

- `editor/editorSlice.ts` - Document text, cursor position, auto-save settings. Text changes go through sanitization middleware before storage.
- `cloudsync/cloudSlice.ts` - Cloud sync state, auth status, per-document sync metadata (hasPendingWrites, fromCache)
- `mode/modeSlice.ts` - Writing mode toggle (editor vs todo document)
- `theme/themeSlice.ts` - Light/dark theme
- `settings/settingsSlice.ts` - General settings
- `hotkeys/hotkeysSlice.ts` - Keyboard shortcut customization
- `structuredTodos/structuredTodosSlice.ts` - AI-extracted todo items

State is hydrated from localStorage at startup via `hydrateXxxStateFromStorage()` functions and persisted via listener middleware.

### Editor Text Pipeline

Text changes follow this flow:
1. `setText` action dispatched (intercepted by sanitization middleware)
2. `storageSanitizationMiddleware` sanitizes input
3. `setTextInternal` action updates state
4. `editorListenerMiddleware` persists to localStorage and triggers cloud sync

### Cloud Sync

Firebase integration is lazily loaded when enabled. Uses Firestore with last-write-wins semantics (immediate saves, no conflict resolution). Auth supports Google sign-in. Documents synced: `users/{userId}/doc/editor` and `users/{userId}/doc/todo`. Sync status UI shows 4 states: disabled, connected, pending (has pending writes), disconnected.

### Cloud Functions

`processTodos` is an HTTP callable function that extracts structured todos using OpenAI. The client calls it with debounced todo text changes (3s). Settings and API key stored in `users/{userId}/settings/structuredTodos`. Extracted todos + content hash synced to `users/{userId}/structuredTodos/data` to avoid redundant processing across clients.

## Testing

Uses Bun test runner with happy-dom. Test utilities in `packages/app/src/test/test-utils.tsx` provide Redux store wrapper.

## Key Patterns

- Container/Component split: `containers/` hold connected components, `components/` are presentational
- Selectors co-located with slices in `selectors.ts` files
- Hotkey scopes: Global, Editor, EditorUnfocused (see `hotkeys/registry`)
