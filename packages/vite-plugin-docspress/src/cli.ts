#!/usr/bin/env node
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { startDocspressSsrServer } from "./server";

const command = process.argv[2] ?? "dev";
const args = process.argv.slice(3);
const packageEntryServer = fileURLToPath(new URL("./entry-server.js", import.meta.url));

switch (command) {
  case "dev":
    await startDocspressSsrServer({ isProduction: false });
    break;
  case "build":
    await run("vite", ["build", "--outDir", "dist/client", ...args]);
    await run("vite", [
      "build",
      "--ssr",
      packageEntryServer,
      "--outDir",
      "dist/server",
      ...args,
    ]);
    break;
  case "start":
  case "preview":
    await startDocspressSsrServer({ isProduction: true });
    break;
  case "--help":
  case "-h":
    printHelp();
    break;
  default:
    console.error(`Unknown docspress command: ${command}`);
    printHelp();
    process.exitCode = 1;
}

function run(binary: string, commandArgs: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(binary, commandArgs, {
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`${binary} ${commandArgs.join(" ")} exited with code ${code}`));
    });
  });
}

function printHelp(): void {
  console.log(`Usage: docspress <command>

Commands:
  dev      Start the Docspress SSR development server
  build    Build client and server bundles
  start    Start the production SSR server
`);
}
