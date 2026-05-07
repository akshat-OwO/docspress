# vite-plugin-docspress

Vite plugin and CLI for building file-based MDX documentation sites.

The plugin scans MDX files, creates virtual route modules, watches docs files in development, and can power either framework-agnostic HTML routes or React-rendered documentation apps.

## Install

```sh
pnpm add vite-plugin-docspress
```

React is optional. Install `react` and `react-dom` only when you use the React router, SSR entries, or generated React starter.

## Vite Plugin

Add Docspress to `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import { docspress } from "vite-plugin-docspress";

export default defineConfig({
  plugins: [docspress()],
});
```

By default, Docspress reads MDX pages from `src/pages` and uses React mode.

```ts
docspress({
  docsDir: "src/pages",
  basePath: "/",
  framework: "react",
  title: "Docspress",
});
```

Use `framework: "vanilla"` when you want framework-agnostic route data and HTML route loading without the React client entry injection.

## Virtual Modules

Docspress exposes virtual modules for app code:

- `virtual:docspress/routes`: route metadata.
- `virtual:docspress/html-routes`: route metadata with rendered HTML loaders.
- `virtual:docspress/react-routes`: route metadata with MDX component loaders.
- `virtual:docspress/sidebar`: optional sidebar config from `src/pages/sidebar.ts`.
- `virtual:docspress/config`: resolved base path and title.

## React Helpers

React apps can import the provided router and page loader:

```tsx
import { DocspressRouter } from "vite-plugin-docspress/react";
import { routes } from "virtual:docspress/react-routes";
import sidebar from "virtual:docspress/sidebar";

export function App() {
  return <DocspressRouter routes={routes} sidebar={sidebar} title="Docs" />;
}
```

## CLI

The package also exposes the `docspress` command:

```sh
docspress dev
docspress build
docspress start
```

- `dev`: starts the Docspress SSR development server.
- `build`: builds Vite client and server bundles.
- `start`: starts the production SSR server.

## Development

From the repository root:

```sh
pnpm --filter vite-plugin-docspress build
pnpm --filter vite-plugin-docspress check-types
pnpm --filter vite-plugin-docspress lint
```
