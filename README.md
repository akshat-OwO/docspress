# Docspress

Docspress is a Vite-powered documentation toolkit for building file-based MDX docs. It can expose framework-agnostic route metadata and HTML routes, and it also ships React helpers for apps that want a ready-made docs shell with server-side rendering.

This repository contains the Docspress Vite plugin, the `docspress` CLI, and the `create-docspress` project scaffolder.

## Quick Start

Create a new Docspress app:

```sh
pnpm create docspress my-docs
cd my-docs
pnpm install
pnpm dev
```

The generated app stores pages in `src/pages` and uses `vite-plugin-docspress` through `vite.config.ts`.

## Packages

- `create-docspress`: scaffolds new Docspress projects.
- `vite-plugin-docspress`: provides the Vite plugin, virtual route modules, React helpers, SSR entries, and the `docspress` CLI.

## Development

Install dependencies from the repository root:

```sh
pnpm install
```

Run the full workspace checks:

```sh
pnpm check
```

Build all packages:

```sh
pnpm build
```

Run examples and packages in development mode:

```sh
pnpm dev
```

You can also target a single package with a pnpm filter:

```sh
pnpm --filter vite-plugin-docspress build
pnpm --filter create-docspress check-types
```

## Versioning and Changelogs

This repo uses Changesets to manage package versions and changelogs.

When a change should be released, add a changeset:

```sh
pnpm changeset
```

Choose the affected package, select the version bump, and write a short summary. When the changeset lands on `main`, the release workflow creates a version PR that updates package versions and package changelogs.
