# Structured Todos Feature

## Overview

The Structured Todos feature uses AI (OpenAI's GPT-4) to automatically extract and organize todo items from the user's todo document. This feature provides an intelligent way to manage tasks by parsing natural language input and creating structured, actionable todo items.

## Architecture

### Client-Side Components

#### Redux Slice (`structuredTodosSlice.ts`)

- Manages the state of structured todos
- Handles enabling/disabling the feature
- Stores API key (write-only, never synced back from cloud)
- Tracks processing state and content hash
- Caches todos in localStorage for offline access

#### Persistence Middleware (`persistenceMiddleware.ts`)

- Syncs settings (enabled state and API key) to Firestore
- Listens for todo text changes and calls the cloud function (with 3s debounce)
- Checks content hash to avoid redundant processing
- Syncs extracted todos + hash to Firestore for cross-client sync
- Listens for structured todos updates from Firestore

#### Structured Todos Service (`structuredTodosService.ts`)

- Wrapper for the Firebase callable function
- Handles content hash generation
- Returns structured todos from the cloud function

#### Structured Todos Manager (`StructuredTodosManager.ts`)

- Manages Firestore listeners for settings and todos data
- Handles saving/loading structured todos to/from Firestore
- Ensures extracted todos sync across multiple clients

#### UI Components

- `TodoItem.tsx`: Individual todo item display with checkbox, priority badge, and due date
- `StructuredTodosList.tsx`: Main list component with sections for Today, Upcoming, and More
- `ToolbarTodoSection.tsx`: Integration point in the toolbar with processing indicator
- `ProcessingIndicator.tsx`: Pulsing indicator shown during AI extraction

### Cloud Functions

#### Firebase Function (`functions/src/index.ts`)

- HTTP callable function `processTodos`
- Authenticates user and checks if feature is enabled
- Retrieves user's OpenAI API key from settings
- Processes todo text through OpenAI API
- Returns structured todos and content hash to client

#### Todo Processor (`structuredTodosProcessor.ts`)

- Uses OpenAI's structured output feature with Zod schemas
- Extracts tasks with:
  - Description
  - Due dates (parsed from natural language)
  - Priority levels (inferred from context)
  - Completion status
- Generates content hash for change detection

## Data Flow

1. User writes tasks in natural language in the todo document
2. Client detects text changes (with 3s debounce)
3. Client checks if content hash differs from last processed
4. If hash differs, checks Firestore for existing processed data with same hash
5. If not found in Firestore, calls `processTodos` cloud function
6. Function processes text with OpenAI and returns structured todos + hash
7. Client saves todos + hash to Firestore (`users/{userId}/structuredTodos/data`)
8. All connected clients receive the update via Firestore listener
9. Todos are displayed in organized sections in the UI

## Settings

Users can configure the feature through Settings > Structured Todos:

- Enable/disable the feature (requires Cloud Sync)
- Provide OpenAI API key (stored securely, write-only)

## Security Considerations

- API keys are stored in Firestore with user-specific access controls
- API keys are never synced back to the client (write-only)
- Each user provides their own OpenAI API key
- Function execution is limited to authenticated users
- Content hash prevents redundant API calls across clients

## Testing

Tests are provided for:

- Redux slice and state management
- Structured todos processor
- Structured todos manager (Firestore sync)
- UI components behavior

Run tests with:

```bash
bun test
```

## Dependencies

- OpenAI SDK for API integration
- Zod for schema validation
- Firebase Functions for serverless processing
- Redux Toolkit for state management
