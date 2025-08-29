# Functions

A collection of firebase functions used in the doppelpunkt app.

## Available Functions

### `processTodoDocument`

**Type:** Firestore Trigger  
**Path:** `users/{userId}/doc/todo`  
**Purpose:** Processes todo documents to extract structured todos using OpenAI's API.

This function:

- Triggers when a todo document is created or updated
- Checks if structured todos are enabled for the user
- Uses the user's OpenAI API key to process the text
- Extracts tasks with descriptions, due dates, and priorities
- Writes the structured todos back to Firestore

## Development

### Installation

```bash
bun install
```

### Serving the functions for local development

```bash
bun run serve
```

What it does:

- Builds the code.
- Starts the Firebase Emulator for Cloud Functions only.

Purpose:

- Runs your functions in a local emulator, simulating the real Firebase environment.
- Lets you test HTTP and background functions as if they were deployed, but locally.
- Good for integration testing, local development, and simulating real-world triggers.

> Use this command to serve the functions for the app in local development.

### Run the functions for local development

```bash
bun run start
# or
bun run shell

# From the terminal, invoke the functions

# Example:
myBackgroundFunction({ data: { name: 'John' } })
```

Note: Since we are currently only using HTTP functions, you can only invoke them through network requests.

What it does:

- Builds the code.
- Starts the Firebase Functions Shell.

Purpose:

- Opens an interactive Node.js REPL (Read-Eval-Print Loop) where you can manually invoke your functions.
- Lets you call your functions with custom data, inspect results, and debug interactively.
- Useful for unit testing and debugging individual function calls without needing to trigger them via HTTP or background events.

> Use this command to run the functions for local development and invoke them manually from the terminal. Although your HTTP functions can be invoked through network requests and therefore it also works with the `app`, but the emulator provides a more realistic local environment for testing.

### Testing

```bash
bun run test
```

### Building

```bash
bun run build
```

Builds the functions to the `lib` directory.

### Deploying

```bash
bun run deploy
```

Deploys the functions to Firebase.
