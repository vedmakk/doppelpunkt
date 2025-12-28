# @doppelpunkt/shared

Shared types, schemas, and utilities used by both the app and cloud functions packages for structured todo extraction.

## Purpose

This package provides a single source of truth for:

- **Zod schemas** for structured LLM outputs (OpenAI and Ollama)
- **System prompt** for todo extraction
- **Response parser** for transforming raw LLM output to `StructuredTodo[]`
- **Shared types** used across the monorepo

## Exports

### Types

```typescript
import type {
  StructuredTodo,
  RawTodo,
  RawTodosResponse,
} from '@doppelpunkt/shared'
```

- `StructuredTodo` - Final todo type with processed fields (id, description, due timestamp, priority, completed)
- `RawTodo` - Inferred type from Zod schema (raw LLM response format)
- `RawTodosResponse` - Full response shape with `todos` array

### Zod Schemas

```typescript
import { TodoSchema, TodosResponseSchema } from '@doppelpunkt/shared'
```

- `TodoSchema` - Schema for a single todo item
- `TodosResponseSchema` - Schema for the full response (array of todos)

Used with:

- OpenAI's `zodTextFormat()` for structured outputs
- `zodToJsonSchema()` for Ollama's JSON schema format parameter

### System Prompt

```typescript
import { getSystemPrompt } from '@doppelpunkt/shared'

const prompt = getSystemPrompt() // Includes current date context
```

Returns the extraction prompt used by both OpenAI and Ollama providers.

### Response Parser

```typescript
import { parseExtractedTodos } from '@doppelpunkt/shared'

const todos = parseExtractedTodos(rawTodos)
```

Transforms raw LLM output to `StructuredTodo[]`:

- Generates sequential IDs (`todo-0`, `todo-1`, ...)
- Converts date strings to timestamps
- Filters out invalid entries
- Handles optional fields (due, priority, completed)

## Usage

### In Cloud Functions (OpenAI)

```typescript
import {
  TodosResponseSchema,
  getSystemPrompt,
  parseExtractedTodos,
} from '@doppelpunkt/shared'
import { zodTextFormat } from 'openai/helpers/zod'

const response = await openai.responses.parse({
  model: 'gpt-4o-mini',
  instructions: getSystemPrompt(),
  input: [{ role: 'user', content: todoText }],
  text: { format: zodTextFormat(TodosResponseSchema, 'todos_extraction') },
})

const todos = parseExtractedTodos(response.output_parsed.todos)
```

### In App (Ollama)

```typescript
import {
  TodosResponseSchema,
  getSystemPrompt,
  parseExtractedTodos,
} from '@doppelpunkt/shared'
import { zodToJsonSchema } from 'zod-to-json-schema'

const response = await fetch(`${url}/api/chat`, {
  method: 'POST',
  body: JSON.stringify({
    model,
    messages: [
      { role: 'system', content: getSystemPrompt() },
      { role: 'user', content: todoText },
    ],
    format: zodToJsonSchema(TodosResponseSchema),
    stream: false,
  }),
})

const data = await response.json()
const parsed = JSON.parse(data.message.content)
const todos = parseExtractedTodos(parsed.todos)
```

## Development

```bash
# Build
bun run build

# Type check
bun run typecheck

# Lint
bun run lint

# Test
bun run test
```
