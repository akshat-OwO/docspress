import { defineConfig } from "rolldown";

export default defineConfig({
  input: {
    app: "src/runtime/app.tsx",
    cli: "src/cli/index.ts",
    index: "src/index.ts",
    client: "src/runtime/client.ts",
    "entry-client": "src/runtime/entry-client.tsx",
    "entry-server": "src/runtime/entry-server.tsx",
    react: "src/runtime/react.tsx",
    server: "src/server/index.ts",
    sidebar: "src/sidebar/index.ts",
    virtual: "src/virtual.ts",
  },
  external: (id) => !id.startsWith(".") && !id.startsWith("/") && !id.startsWith("\0"),
  output: {
    dir: "dist",
    entryFileNames: "[name].js",
    format: "esm",
  },
});
