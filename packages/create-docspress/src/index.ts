#!/usr/bin/env node
import { stdin as input, stdout as output } from "node:process";
import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";

interface CliOptions {
  target?: string;
  template?: string;
  packageManager?: string;
  install?: boolean;
}

const args = process.argv.slice(2);
const options = parseArgs(args);
const rl = readline.createInterface({ input, output });
const packageRoot = path.resolve(fileURLToPath(import.meta.url), "../..");
const packageMetadata = JSON.parse(
  await fs.readFile(path.join(packageRoot, "package.json"), "utf8"),
) as { version: string };
const runtimeVersion = packageMetadata.version;

function parseArgs(values: string[]): CliOptions {
  const parsed: CliOptions = {};

  for (let index = 0; index < values.length; index += 1) {
    const value = values[index];

    if (value === "--template") {
      parsed.template = values[index + 1];
      index += 1;
      continue;
    }

    if (value === "--package-manager") {
      parsed.packageManager = values[index + 1];
      index += 1;
      continue;
    }

    if (value === "--no-install") {
      parsed.install = false;
      continue;
    }

    if (!value.startsWith("-") && !parsed.target) {
      parsed.target = value;
    }
  }

  return parsed;
}

async function ask(label: string, fallback: string): Promise<string> {
  const answer = await rl.question(`${label} (${fallback}): `);
  return answer.trim() || fallback;
}

async function scaffoldReactProject(root: string, name: string): Promise<void> {
  await ensureEmptyDirectory(root);

  const files: Record<string, string> = {
    "index.html": indexHtml,
    "package.json": packageJson(name),
    "tsconfig.json": tsconfigJson,
    "vite.config.ts": viteConfig,
    "src/pages/index.mdx": indexPage,
    "src/pages/introduction.mdx": introductionPage,
  };

  await Promise.all(
    Object.entries(files).map(async ([relativePath, contents]) => {
      const file = path.join(root, relativePath);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, contents);
    }),
  );
}

async function ensureEmptyDirectory(root: string): Promise<void> {
  try {
    const entries = await fs.readdir(root);

    if (entries.length > 0) {
      throw new Error(`Target directory is not empty: ${root}`);
    }
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      await fs.mkdir(root, { recursive: true });
      return;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function packageJson(name: string): string {
  return `${JSON.stringify(
    {
      name,
      private: true,
      type: "module",
      scripts: {
        dev: "docspress dev",
        build: "tsc && docspress build",
        "check-types": "tsc --noEmit",
        preview: "docspress start",
        start: "docspress start",
      },
      dependencies: {
        "@vitejs/plugin-react": "^6.0.1",
        react: "^19.2.5",
        "react-dom": "^19.2.5",
        "vite-plugin-docspress": `^${runtimeVersion}`,
      },
      devDependencies: {
        "@types/react": "^19.2.14",
        "@types/react-dom": "^19.2.3",
        typescript: "~6.0.2",
        vite: "^8.0.10",
      },
    },
    null,
    2,
  )}\n`;
}

const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Docspress</title>
  </head>
  <body>
    <div id="app"><!--app-html--></div>
  </body>
</html>
`;

const tsconfigJson = `{
  "compilerOptions": {
    "target": "es2023",
    "module": "esnext",
    "lib": ["ES2023", "DOM"],
    "jsx": "react-jsx",
    "types": ["vite/client"],
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "verbatimModuleSyntax": true,
    "moduleDetection": "force",
    "noEmit": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src", "vite.config.ts"]
}
`;

const viteConfig = `import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { docspress } from "vite-plugin-docspress";

export default defineConfig({
  plugins: [docspress(), react()],
});
`;

const indexPage = `# Welcome to Docspress

Edit this page in \`src/pages/index.mdx\`.

- [Introduction](/introduction)
`;

const introductionPage = `# Introduction

This page is loaded from \`src/pages/introduction.mdx\` and server-rendered by Docspress.
`;

try {
  const target = options.target ?? (await ask("Project name", "my-docs"));
  const template = options.template ?? (await ask("Framework", "react"));

  if (template !== "react") {
    throw new Error("Only the React template is available right now.");
  }

  await scaffoldReactProject(path.resolve(process.cwd(), target), path.basename(target));
  console.log(`\nCreated Docspress app in ${target}`);
  console.log("\nNext steps:");
  console.log(`  cd ${target}`);
  console.log("  pnpm install");
  console.log("  pnpm dev");
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  rl.close();
}
