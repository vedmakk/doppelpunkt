The project is a monorepo containing the following packages:

- [app](./packages/app): The main web app (react, typescript, vite.js)
- [functions](./packages/functions): A collection of firebase functions used in the app (typescript)

The project uses `bun` as the package manager.

From the project root, you can run the following commands:

Lint:

```bash
bun run lint
```

Prettier:

```bash
bun run prettier
```

Test:

```bash
bun run test
```

Build:

```bash
bun run build
```

You can find more commands in the `package.json` file in the root of the project, as well as in the `package.json` files in the individual `packages` folders.
