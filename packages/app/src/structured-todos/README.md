# Structured Todos Feature

## Overview

The Structured Todos feature uses AI to automatically extract and organize todo items from the user's todo document. This feature provides an intelligent way to manage tasks by parsing natural language input and creating structured, actionable todo items.

## Processing Modes

The feature supports two processing modes:

### Cloud Mode (OpenAI)

- Uses OpenAI's GPT models via Firebase Cloud Functions
- Requires cloud sync to be enabled
- API key is stored securely (encrypted) in the cloud
- Syncs extracted todos across multiple devices

### Local Mode (Ollama)

- Uses a local Ollama instance running on the user's machine
- No cloud sync required - works completely offline
- No API key needed
- Processing happens entirely on the user's device
- Todos are cached in localStorage

To use local mode:

1. Install Ollama from https://ollama.ai
2. Pull a model: `ollama pull llama3.2` (or any other model)
3. Start Ollama (it runs on http://localhost:11434 by default)
4. In Settings > Structured Todos, select "Local (Ollama)"
5. Enter the model name you pulled
6. Click "Test Connection" to verify
7. Enable Structured Todos

## Architecture

### Client-Side Components

#### Redux Slice (`structuredTodosSlice.ts`)

- Manages the state of structured todos
- Handles enabling/disabling the feature
- Stores processing mode (cloud or local)
- Stores API key for cloud mode (write-only, never synced back)
- Stores Ollama configuration for local mode (URL and model)
- Tracks processing state and content hash
- Caches todos in localStorage for offline access

#### Persistence Middleware (`persistenceMiddleware.ts`)

- Syncs settings to Firestore (cloud mode only)
- Listens for todo text changes and processes them (with 3s debounce)
- Routes processing to cloud function or local Ollama based on mode
- Checks content hash to avoid redundant processing
- For local mode: includes model name in hash to invalidate cache when model changes

#### Structured Todos Service (`structuredTodosService.ts`)

- Wrapper for the Firebase callable function (cloud mode)
- Handles content hash generation
- Returns structured todos from the cloud function

#### Ollama Service (`ollamaService.ts`)

- HTTP client for local Ollama instance
- `testOllamaConnection()`: Tests if Ollama is running and lists available models
- `processWithOllama()`: Sends todo text to Ollama and parses the response
- Handles errors: connection refused, invalid model, timeouts

#### Prompts (`prompts.ts`)

- Shared extraction prompt used by both cloud and local processing
- Ensures consistent extraction behavior across modes

#### Structured Todos Manager (`StructuredTodosManager.ts`)

- Manages Firestore listeners for settings and todos data (cloud mode)
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

### Cloud Mode

1. User writes tasks in natural language in the todo document
2. Client detects text changes (with 3s debounce)
3. Client checks if content hash differs from last processed
4. If hash differs, checks Firestore for existing processed data with same hash
5. If not found in Firestore, calls `processTodos` cloud function
6. Function processes text with OpenAI and returns structured todos + hash
7. Client saves todos + hash to Firestore (`users/{userId}/structuredTodos/data`)
8. All connected clients receive the update via Firestore listener
9. Todos are displayed in organized sections in the UI

### Local Mode

1. User writes tasks in natural language in the todo document
2. Client detects text changes (with 3s debounce)
3. Client checks if content hash (including model name) differs from last processed
4. If hash differs, calls local Ollama instance directly via HTTP
5. Ollama processes text and returns JSON with extracted todos
6. Client parses response and updates state
7. Todos are cached in localStorage
8. Todos are displayed in organized sections in the UI

## Settings

Users can configure the feature through Settings > Structured Todos:

### Processing Mode

- **Cloud (OpenAI)**: Requires cloud sync, uses OpenAI API via Firebase
- **Local (Ollama)**: No cloud required, uses local Ollama instance

### Cloud Mode Settings

- OpenAI API key (stored securely, write-only, encrypted server-side)

### Local Mode Settings

- Ollama Server URL (default: http://localhost:11434)
- Ollama Model (user must specify, e.g., llama3.2, mistral)
- Test Connection button to verify Ollama is running

## Security Considerations

### Cloud Mode

- API keys are stored in Firestore with envelope encryption
- API keys are never synced back to the client (write-only)
- Each user provides their own OpenAI API key
- Function execution is limited to authenticated users
- Content hash prevents redundant API calls across clients

### Local Mode

- No data leaves the user's machine
- No API keys required
- Processing is completely private
- Ollama must be running locally

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

### Shared Package (`@doppelpunkt/shared`)

Both cloud and local modes share common code via the `@doppelpunkt/shared` package:

- Zod schemas for structured LLM outputs (`TodoSchema`, `TodosResponseSchema`)
- System prompt for todo extraction (`getSystemPrompt()`)
- Response parser (`parseExtractedTodos()`)
- Shared types (`StructuredTodo`, `RawTodo`)

This ensures consistent extraction behavior across both modes.

### Cloud Mode

- OpenAI SDK for API integration
- `@doppelpunkt/shared` for schemas and parsing
- Firebase Functions for serverless processing
- Redux Toolkit for state management

### Local Mode

- Ollama (external, user must install separately)
- `@doppelpunkt/shared` for schemas and parsing
- `zod-to-json-schema` for converting Zod schemas to JSON schema (Ollama structured outputs)
- Redux Toolkit for state management
- Native fetch API for HTTP communication (uses `/api/chat` endpoint with structured format)
