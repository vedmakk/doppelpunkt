# Functions

A collection of firebase functions used in the doppelpunkt app.

## Available Functions

### `processTodos`

**Type:** HTTP Callable
**Purpose:** Processes todo text to extract structured todos using OpenAI's API.

This function:

- Called by the client when todo text changes (with 3s debounce)
- Checks if structured todos are enabled for the user
- Retrieves and decrypts the user's OpenAI API key from secure storage
- Extracts tasks with descriptions, due dates, and priorities
- Returns structured todos and content hash to the client

### `setApiKey`

**Type:** HTTP Callable
**Purpose:** Securely stores a user's OpenAI API key.

This function:

- Receives the plaintext API key from the client
- Encrypts it using AES-256-GCM with a per-user derived key
- Stores the encrypted key in `users/{userId}/secrets/apiKey` (not accessible to clients)
- Sets `hasApiKey: true` in the user's settings

### `clearApiKey`

**Type:** HTTP Callable
**Purpose:** Removes a user's stored API key.

This function:

- Deletes the encrypted key from `users/{userId}/secrets/apiKey`
- Sets `hasApiKey: false` in the user's settings

## Development

### Installation

```bash
bun install
```

### Setting up secrets for local development

The functions use Firebase secrets for sensitive configuration (e.g., `ENCRYPTION_MASTER_KEY`). For local emulator testing, create a `.secret.local` file in this directory:

```bash
# packages/functions/.secret.local
ENCRYPTION_MASTER_KEY=your-local-test-key-at-least-32-chars
```

This file is automatically read by the Firebase emulator. **Do not commit this file** (it's already in `.gitignore`).

For production, set secrets using:

```bash
firebase functions:secrets:set ENCRYPTION_MASTER_KEY
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

The build uses Bun's bundler to create a single bundled file. This is necessary because:

- Firebase Cloud Functions deployment uses npm, which doesn't support Bun/pnpm workspace protocols (`workspace:*`)
- Bundling inlines all local dependencies (`@doppelpunkt/shared`) and npm packages (`openai`, `zod`) into a single file
- Only `firebase-admin` and `firebase-functions` are kept external (provided by Firebase at runtime)

This approach eliminates the `EUNSUPPORTEDPROTOCOL` error that would otherwise occur during deployment.

### Deploying

```bash
bun run deploy
```

Deploys the functions to Firebase.
