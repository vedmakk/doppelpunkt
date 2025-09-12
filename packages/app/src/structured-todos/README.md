# Structured Todos Feature

## Overview

The Structured Todos feature uses AI (OpenAI's GPT-4) to automatically extract and organize todo items from the user's todo document. This feature provides an intelligent way to manage tasks by parsing natural language input and creating structured, actionable todo items.

## Architecture

### Client-Side Components

#### Redux Slice (`structuredTodosSlice.ts`)

- Manages the state of structured todos
- Handles enabling/disabling the feature
- Stores API key (write-only, never synced back from cloud)
- Caches todos in localStorage for offline access

#### Persistence Middleware (`persistenceMiddleware.ts`)

- Syncs settings (enabled state and API key) to Firestore
- Listens for structured todos updates from Firestore
- Ensures API key is write-only (never synced back to client)

#### UI Components

- `TodoItem.tsx`: Individual todo item display with checkbox, priority badge, and due date
- `StructuredTodosList.tsx`: Main list component with sections for Today, Upcoming, and More
- `ToolbarTodoSection.tsx`: Integration point in the toolbar

### Cloud Functions

#### Firebase Function (`functions/src/index.ts`)

- Triggers on todo document writes
- Checks if structured todos are enabled for the user
- Retrieves user's OpenAI API key from settings
- Processes todo text through OpenAI API
- Writes structured todos back to Firestore

#### Todo Processor (`structuredTodosProcessor.ts`)

- Uses OpenAI's structured output feature with Zod schemas
- Extracts tasks with:
  - Description
  - Due dates (parsed from natural language)
  - Priority levels (inferred from context)
  - Completion status

## Data Flow

1. User writes tasks in natural language in the todo document
2. Document changes trigger Firebase function
3. Function checks user settings and API key
4. OpenAI API processes text and returns structured todos
5. Structured todos are written back to Firestore
6. Client receives update via Firestore listener
7. Todos are displayed in organized sections in the UI

## Settings

Users can configure the feature through Settings > Structured Todos:

- Enable/disable the feature
- Provide OpenAI API key (stored securely, write-only)

## Security Considerations

- API keys are stored in Firestore with user-specific access controls
- API keys are never synced back to the client (write-only)
- Each user provides their own OpenAI API key
- Function execution is limited to authenticated users

## Testing

Tests are provided for:

- Redux slice and state management
- Structured todos processor
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
