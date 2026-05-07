# create-docspress

Scaffold a new Docspress project from the command line.

## Usage

Create a project with your package manager:

```sh
pnpm create docspress my-docs
```

Then start the generated app:

```sh
cd my-docs
pnpm install
pnpm dev
```

The generated project includes:

- `src/pages/index.mdx`
- `src/pages/introduction.mdx`
- `vite.config.ts` with `vite-plugin-docspress`
- scripts for `dev`, `build`, `preview`, and `start`

## Options

```sh
create-docspress [target] [--template react] [--package-manager pnpm] [--no-install]
```

- `target`: project directory. If omitted, the CLI prompts for one.
- `--template react`: selects the React starter. React is currently the only scaffolded template.
- `--package-manager <name>`: reserved for package-manager selection.
- `--no-install`: reserved for skipping dependency installation.

Docspress itself is framework-agnostic at the plugin level, but this scaffolder currently generates the React starter.

## Development

From the repository root:

```sh
pnpm --filter create-docspress build
pnpm --filter create-docspress check-types
pnpm --filter create-docspress lint
```
