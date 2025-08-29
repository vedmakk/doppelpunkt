# App

The web app for doppelpunkt.

## Docs

You can find docs in the [docs](./docs) directory.

## Development

### Installation

```bash
bun install
```

### Running the app

```bash
bun run dev
```

Compiles and runs the app in development mode.

Open http://localhost:3000 to view it in the browser.

The page will reload if you make edits.
You will also see any compile or lint errors in the console.

If you want the firebase functions to be available, also run the `packages/functions` package in a parallel terminal.

### Testing

```bash
bun run test
```

### Building the app

```bash
bun run build
```

Builds the app for production to the `dist` folder. It build the app using vite and then prerenders static pages.

### Deploying the app

```bash
bun run deploy
```

Deploys only the app to Firebase Hosting.

### Ladle

The project contains a full [Ladle](https://ladle.dev) configuration. Writing stories for your UI components allows building & testing them in isolation. Stories are contained in [src/stories](src/stories).

To run locally:

```bash
bunx --bun ladle serve
```
